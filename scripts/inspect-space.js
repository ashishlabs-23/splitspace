const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
const PROJECT_ID = sa.project_id;
const SPACE_ID = '6cec6ba4-f212-4b97-b94f-132234a6230f';

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const h = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const sign = `${h}.${p}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(sign);
  return `${sign}.${base64url(signer.sign(sa.private_key))}`;
}
function req(method, url, data, headers) {
  return new Promise((resolve, reject) => {
    const body = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method, headers: { ...headers, ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) } };
    const r = https.request(opts, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } }); });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}
async function getToken() {
  const r = await req('POST', 'https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${createJWT()}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  if (r.status !== 200) throw new Error('Token error: ' + JSON.stringify(r.body));
  return r.body.access_token;
}

async function run() {
  const token = await getToken();
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

  // Fetch the actual space document to see all its fields
  console.log(`\n=== SPACE DOCUMENT FIELDS (${SPACE_ID}) ===`);
  const r = await req('GET', `${BASE}/spaces/${SPACE_ID}`, null, auth);
  if (r.status !== 200) { console.error('Error:', r.body); return; }
  
  const fields = r.body.fields || {};
  console.log('All fields in space document:');
  for (const [key, val] of Object.entries(fields)) {
    const v = val.stringValue ?? val.booleanValue ?? val.integerValue ?? val.doubleValue ??
              (val.arrayValue ? `[Array: ${(val.arrayValue.values||[]).length} items]` : null) ??
              (val.mapValue ? '{Map}' : null) ?? JSON.stringify(val);
    console.log(`  ${key}: ${v}`);
  }

  // Check specifically the fields needed by baseSpaceFieldsUnchanged
  console.log('\n=== FIELDS REQUIRED BY baseSpaceFieldsUnchanged ===');
  const required = ['id', 'createdBy', 'ownerUid', 'createdAt'];
  for (const f of required) {
    const present = f in fields;
    const val = fields[f]?.stringValue ?? fields[f]?.integerValue ?? JSON.stringify(fields[f]);
    console.log(`  ${present ? '✅' : '❌'} ${f}: ${present ? val : 'MISSING'}`);
  }
  
  console.log('\n=== FIELDS REQUIRED BY selfJoinSpaceUpdate ===');
  const listFields = ['memberUids', 'memberEmails', 'members'];
  for (const f of listFields) {
    const present = f in fields;
    const isArray = fields[f]?.arrayValue !== undefined;
    console.log(`  ${present && isArray ? '✅' : '❌'} ${f}: ${present ? (isArray ? `Array[${(fields[f].arrayValue.values||[]).length}]` : 'NOT an array!') : 'MISSING'}`);
  }
}

run().catch(err => { console.error(err.message); process.exit(1); });
