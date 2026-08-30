const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');

// Load service account
const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
const PROJECT_ID = sa.project_id;
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend', 'out');

function base64url(buffer) {
  return Buffer.from(buffer).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.hosting https://www.googleapis.com/auth/cloud-platform',
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

function httpsRequest(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = Buffer.isBuffer(data) ? data : (typeof data === 'string' ? data : (data ? JSON.stringify(data) : null));
    
    const reqHeaders = { ...headers };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
      if (!reqHeaders['Content-Type'] && typeof data === 'object' && !Buffer.isBuffer(data)) {
        reqHeaders['Content-Type'] = 'application/json';
      }
    }

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: reqHeaders,
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const jwt = createJWT();
  const resp = await httpsRequest(
    'https://oauth2.googleapis.com/token',
    'POST',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  if (resp.status !== 200) throw new Error('Token auth failed: ' + JSON.stringify(resp.body));
  return resp.body.access_token;
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const relPath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath);
      const gzipped = zlib.gzipSync(content, { level: 9 });
      const hash = crypto.createHash('sha256').update(gzipped).digest('hex');
      files.push({ path: relPath, fullPath, hash, gzipped, size: content.length });
    }
  }
  return files;
}

async function deploy() {
  console.log('🚀 Authenticating with Google Cloud...');
  const token = await getAccessToken();
  console.log('✅ Authenticated successfully.');

  console.log(`📁 Scanning and compressing build files in ${PUBLIC_DIR}...`);
  if (!fs.existsSync(PUBLIC_DIR)) {
    throw new Error(`Export directory ${PUBLIC_DIR} does not exist. Run 'npm run build' first.`);
  }

  const files = getAllFiles(PUBLIC_DIR);
  console.log(`📦 Processed ${files.length} static assets.`);

  const fileHashMap = {};
  const hashToGzip = {};
  const hashToPath = {};
  for (const f of files) {
    fileHashMap[f.path] = f.hash;
    hashToGzip[f.hash] = f.gzipped;
    hashToPath[f.hash] = f.fullPath;
  }

  console.log('✨ Creating new Firebase Hosting version...');
  const versionResp = await httpsRequest(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${PROJECT_ID}/versions`,
    'POST',
    {
      config: {
        rewrites: [
          { glob: '**', path: '/index.html' }
        ]
      }
    },
    { Authorization: `Bearer ${token}` }
  );

  if (versionResp.status !== 200) {
    throw new Error('Failed to create version: ' + JSON.stringify(versionResp.body));
  }

  const versionName = versionResp.body.name;
  console.log(`📋 Version created: ${versionName}`);

  console.log('🔍 Checking required file uploads...');
  const populateResp = await httpsRequest(
    `https://firebasehosting.googleapis.com/v1beta1/${versionName}:populateFiles`,
    'POST',
    { files: fileHashMap },
    { Authorization: `Bearer ${token}` }
  );

  if (populateResp.status !== 200) {
    throw new Error('Failed to populate files: ' + JSON.stringify(populateResp.body));
  }

  const uploadUrl = populateResp.body.uploadUrl;
  const requiredHashes = populateResp.body.uploadRequiredHashes || [];
  console.log(`📤 Files to upload: ${requiredHashes.length} / ${files.length}`);

  for (let i = 0; i < requiredHashes.length; i++) {
    const hash = requiredHashes[i];
    const gzipData = hashToGzip[hash];
    const filePath = hashToPath[hash];

    const upResp = await httpsRequest(
      `${uploadUrl}/${hash}`,
      'POST',
      gzipData,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      }
    );

    if (upResp.status !== 200) {
      throw new Error(`Failed to upload ${filePath}: ${JSON.stringify(upResp.body)}`);
    }
    process.stdout.write(`  [${i + 1}/${requiredHashes.length}] Uploaded ${path.basename(filePath)}\r`);
  }
  if (requiredHashes.length > 0) console.log('\n✅ All assets uploaded.');

  console.log('🔒 Finalizing version status...');
  const finalizeResp = await httpsRequest(
    `https://firebasehosting.googleapis.com/v1beta1/${versionName}?update_mask=status`,
    'PATCH',
    { status: 'FINALIZED' },
    { Authorization: `Bearer ${token}` }
  );

  if (finalizeResp.status !== 200) {
    throw new Error('Failed to finalize version: ' + JSON.stringify(finalizeResp.body));
  }
  console.log('✅ Version finalized.');

  console.log('🚀 Releasing to live site...');
  const releaseResp = await httpsRequest(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${PROJECT_ID}/releases?versionName=${encodeURIComponent(versionName)}`,
    'POST',
    {},
    { Authorization: `Bearer ${token}` }
  );

  if (releaseResp.status !== 200) {
    throw new Error('Failed to create release: ' + JSON.stringify(releaseResp.body));
  }

  console.log('\n🎉 SUCCESS! SplitSpace frontend deployed live to:');
  console.log(`👉 https://${PROJECT_ID}.web.app`);
  console.log(`👉 https://${PROJECT_ID}.firebaseapp.com\n`);
}

deploy().catch(err => {
  console.error('❌ Deployment error:', err.message);
  process.exit(1);
});
