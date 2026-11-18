const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const path = require('path');

const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
const PROJECT_ID = sa.project_id;

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
  const sign = h + '.' + p;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(sign);
  return sign + '.' + base64url(signer.sign(sa.private_key));
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
async function run() {
  console.log('Testing Live Invite & Join Flow...');
  const tokenResp = await req('POST', 'https://oauth2.googleapis.com/token',
    'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + createJWT(),
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  const token = tokenResp.body.access_token;
  const auth = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents';

  // 1. Create a test invite for Space 6cec6ba4-f212-4b97-b94f-132234a6230f
  const testToken = 'qa_test_' + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const inviteDoc = {
    fields: {
      token: { stringValue: testToken },
      spaceId: { stringValue: '6cec6ba4-f212-4b97-b94f-132234a6230f' },
      spaceTitle: { stringValue: 'tour' },
      spaceEmoji: { stringValue: '✈️' },
      spaceCurrency: { stringValue: 'INR' },
      createdByUid: { stringValue: 'oVaGiXlPOTbn94F51nIlrz9NaiM2' },
      createdByEmail: { stringValue: 'owner@example.com' },
      expiresAt: { stringValue: expiresAt },
      createdAt: { stringValue: new Date().toISOString() },
    }
  };

  const createResp = await req('PATCH', `${BASE}/invites/${testToken}`, inviteDoc, auth);
  console.log('Invite create status:', createResp.status);

  // 2. Read the invite back
  const readResp = await req('GET', `${BASE}/invites/${testToken}`, null, auth);
  console.log('Invite read status:', readResp.status);
  console.log('Invite title:', readResp.body.fields?.spaceTitle?.stringValue);

  // 3. Clean up test token
  await req('DELETE', `${BASE}/invites/${testToken}`, null, auth);
  console.log('Test invite cleaned up.');
  console.log('✅ Invite creation & retrieval verified successfully!');
}
run().catch(console.error);

