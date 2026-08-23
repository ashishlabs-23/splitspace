const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load service account
const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));

// Load firestore rules
const rulesContent = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');

const PROJECT_ID = sa.project_id;

// Create JWT for service account auth
function base64url(buffer) {
  return Buffer.from(buffer).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const sign = `${header}.${payload}`;
  const privateKey = sa.private_key;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(sign);
  const signature = base64url(signer.sign(privateKey));
  return `${sign}.${signature}`;
}

function httpsPost(url, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': headers['Content-Type'] || 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  // Step 1: Exchange JWT for access token
  console.log('Getting access token...');
  const jwt = createJWT();
  const tokenResp = await httpsPost('https://oauth2.googleapis.com/token', 
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );

  if (tokenResp.status !== 200) {
    console.error('Failed to get access token:', tokenResp.body);
    process.exit(1);
  }
  const accessToken = tokenResp.body.access_token;
  console.log('Got access token!');

  // Step 2: Create a new ruleset
  console.log('Creating new Firestore ruleset...');
  const rulesetResp = await httpsPost(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
    {
      source: {
        files: [{
          name: 'firestore.rules',
          content: rulesContent,
        }]
      }
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (rulesetResp.status !== 200) {
    console.error('Failed to create ruleset:', JSON.stringify(rulesetResp.body, null, 2));
    process.exit(1);
  }

  const rulesetName = rulesetResp.body.name;
  console.log('Created ruleset:', rulesetName);

  // Step 3: Get current release for cloud.firestore
  console.log('Getting Firestore release...');
  const releaseResp = await httpsGet(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
    { Authorization: `Bearer ${accessToken}` }
  );

  if (releaseResp.status !== 200) {
    // Create new release
    console.log('Creating new release...');
  }

  // Step 4: Update the release to point to new ruleset
  console.log('Updating Firestore release to use new ruleset...');
  const patchUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`;
  const patchBody = {
    release: {
      name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
      rulesetName: rulesetName,
    }
  };

  // Try PATCH first
  const patchResp = await new Promise((resolve, reject) => {
    const body = JSON.stringify(patchBody);
    const urlObj = new URL(patchUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (patchResp.status !== 200) {
    console.log('PATCH failed, trying PUT...');
    // Try PUT (create new release)
    const putResp = await new Promise((resolve, reject) => {
      const body = JSON.stringify({
        name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
        rulesetName: rulesetName,
      });
      const urlObj = new URL(patchUrl);
      const options = {
        hostname: urlObj.hostname,
        path: `/v1/projects/${PROJECT_ID}/releases`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    console.log('PUT response:', putResp.status, JSON.stringify(putResp.body, null, 2));
  } else {
    console.log('Successfully deployed Firestore rules!');
    console.log('Release updated:', patchResp.body.name);
    console.log('Ruleset:', patchResp.body.rulesetName);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
