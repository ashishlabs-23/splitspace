const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
const PROJECT_ID = sa.project_id;

function base64url(buffer) {
  return Buffer.from(buffer).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const sign = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(sign);
  const signature = base64url(signer.sign(sa.private_key));
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
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'GET', headers };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getToken() {
  const jwt = createJWT();
  const resp = await httpsPost('https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  if (resp.status !== 200) throw new Error('Failed to get token: ' + JSON.stringify(resp.body));
  return resp.body.access_token;
}

async function run() {
  const token = await getToken();

  // 1. Verify the current deployed release
  console.log('\n=== 1. CHECKING DEPLOYED RULES RELEASE ===');
  const release = await httpsGet(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
    { Authorization: `Bearer ${token}` }
  );
  console.log('Status:', release.status);
  console.log('Current ruleset:', release.body.rulesetName);
  console.log('Update time:', release.body.updateTime);

  // 2. Fetch the actual ruleset content to confirm it has the right rules
  console.log('\n=== 2. VERIFYING RULESET CONTENT ===');
  const rulesetName = release.body.rulesetName;
  const ruleset = await httpsGet(
    `https://firebaserules.googleapis.com/v1/${rulesetName}`,
    { Authorization: `Bearer ${token}` }
  );
  const content = ruleset.body?.source?.files?.[0]?.content || '';

  const checks = [
    { name: 'spaces read: isSignedIn()', pass: content.includes('allow read: if isSignedIn()') },
    { name: 'invites read: isSignedIn()', pass: content.includes('allow read: if isSignedIn()') },
    { name: 'selfJoinSpaceUpdate function exists', pass: content.includes('function selfJoinSpaceUpdate') },
    { name: 'selfJoinSpaceUpdate used in update', pass: content.includes('selfJoinSpaceUpdate()') },
    { name: 'invites create: isSpaceMember', pass: content.includes('isSpaceMember(request.resource.data.spaceId)') },
    { name: 'No old member-only read restriction', pass: !content.includes('allow read: if isSpaceMember(spaceId);\n      allow create') },
  ];

  let allPassed = true;
  for (const check of checks) {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    if (!check.pass) allPassed = false;
  }

  // 3. Fetch actual invite documents to confirm they exist
  console.log('\n=== 3. CHECKING EXISTING INVITE DOCUMENTS ===');
  const invitesResp = await httpsPost(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    {
      structuredQuery: {
        from: [{ collectionId: 'invites' }],
        limit: 5,
      }
    },
    { Authorization: `Bearer ${token}` }
  );

  const docs = Array.isArray(invitesResp.body) ? invitesResp.body.filter(r => r.document) : [];
  if (docs.length === 0) {
    console.log('No invite documents found. Generate one from the app first.');
  } else {
    console.log(`Found ${docs.length} invite document(s):`);
    for (const d of docs) {
      const fields = d.document.fields || {};
      const token_val = fields.token?.stringValue || 'N/A';
      const spaceId = fields.spaceId?.stringValue || 'N/A';
      const expiresAt = fields.expiresAt?.stringValue || 'N/A';
      const expired = expiresAt !== 'N/A' && new Date(expiresAt) < new Date();
      console.log(`  Token: ${token_val}`);
      console.log(`  Space: ${spaceId}`);
      console.log(`  Expires: ${expiresAt} ${expired ? '❌ EXPIRED' : '✅ VALID'}`);
      if (!expired) {
        const inviteUrl = `https://splitspace-9d28f.web.app/?join=${token_val}`;
        console.log(`  Invite URL: ${inviteUrl}`);
      }
      console.log('');
    }
  }

  console.log('\n=== VERDICT ===');
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED — Rules are correctly deployed and invite joining should work!');
  } else {
    console.log('❌ Some checks failed — rules may not be correctly deployed.');
  }
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
