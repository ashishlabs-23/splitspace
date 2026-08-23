const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const sa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf8'));
const PROJECT_ID = sa.project_id;
const TOKEN = '763ce6854f544a41';

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

function request(method, url, data, headers) {
  return new Promise((resolve, reject) => {
    const body = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: { ...headers, ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getToken() {
  const jwt = createJWT();
  const resp = await request('POST', 'https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  if (resp.status !== 200) throw new Error('Token error: ' + JSON.stringify(resp.body));
  return resp.body.access_token;
}

async function run() {
  const accessToken = await getToken();
  const auth = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

  console.log(`\n=== TRACING INVITE TOKEN: ${TOKEN} ===\n`);

  // 1. Check if the invite token document exists
  console.log('1. Fetching invite document...');
  const inviteResp = await request('GET', `${BASE}/invites/${TOKEN}`, null, auth);
  
  if (inviteResp.status === 404) {
    console.log('❌ INVITE TOKEN NOT FOUND — This token does not exist in Firestore!');
    console.log('   The link is either invalid or was never created.');
    return;
  }

  if (inviteResp.status !== 200) {
    console.log(`❌ Error fetching invite: HTTP ${inviteResp.status}`, inviteResp.body);
    return;
  }

  const fields = inviteResp.body.fields || {};
  const spaceId = fields.spaceId?.stringValue;
  const expiresAt = fields.expiresAt?.stringValue;
  const createdByUid = fields.createdByUid?.stringValue;
  const spaceTitle = fields.spaceTitle?.stringValue;

  console.log('✅ Invite found!');
  console.log(`   Token:       ${TOKEN}`);
  console.log(`   Space ID:    ${spaceId}`);
  console.log(`   Space Title: ${spaceTitle || '(not stored in invite — OLD FORMAT)'}`);
  console.log(`   Created by:  ${createdByUid}`);
  console.log(`   Expires:     ${expiresAt}`);

  const expired = expiresAt && new Date(expiresAt) < new Date();
  console.log(`   Status:      ${expired ? '❌ EXPIRED' : '✅ VALID'}`);

  if (!spaceTitle) {
    console.log('\n⚠️  NOTE: This invite was created BEFORE the metadata fix.');
    console.log('   spaceTitle/spaceEmoji not stored. getInviteInfo() will still try to read the space directly.');
  }

  // 2. Check if the space exists
  if (!spaceId) {
    console.log('\n❌ No spaceId in invite document!');
    return;
  }

  console.log(`\n2. Fetching space document (${spaceId})...`);
  const spaceResp = await request('GET', `${BASE}/spaces/${spaceId}`, null, auth);

  if (spaceResp.status === 404) {
    console.log('❌ SPACE NOT FOUND — The space this invite points to no longer exists!');
    return;
  }
  if (spaceResp.status !== 200) {
    console.log(`❌ Error fetching space: HTTP ${spaceResp.status}`, spaceResp.body);
    return;
  }

  const sf = spaceResp.body.fields || {};
  const title = sf.title?.stringValue || '(no title)';
  const memberUids = sf.memberUids?.arrayValue?.values?.map(v => v.stringValue) || [];
  const currency = sf.currency?.stringValue || '?';

  console.log('✅ Space found!');
  console.log(`   Title:    ${title}`);
  console.log(`   Currency: ${currency}`);
  console.log(`   Members:  ${memberUids.length} (${memberUids.join(', ')})`);

  // 3. Check Firestore rules (fetch deployed rules to confirm spaces read = isSignedIn)
  console.log('\n3. Checking active Firestore rules...');
  const releaseResp = await request('GET',
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
    null, auth
  );
  const rulesetName = releaseResp.body?.rulesetName;
  const rulesetResp = await request('GET', `https://firebaserules.googleapis.com/v1/${rulesetName}`, null, auth);
  const rulesContent = rulesetResp.body?.source?.files?.[0]?.content || '';
  
  const spacesReadOpen = /match \/spaces\/\{spaceId\}[^}]*allow read: if isSignedIn\(\)/.test(rulesContent.replace(/\n/g, ' '));
  console.log(`   /spaces read open to all signed-in users: ${spacesReadOpen ? '✅ YES' : '❌ NO — still member-only!'}`);

  const selfJoinOk = rulesContent.includes('function selfJoinSpaceUpdate');
  console.log(`   selfJoinSpaceUpdate function present: ${selfJoinOk ? '✅ YES' : '❌ NO'}`);

  // 4. Summary
  console.log('\n=== DIAGNOSIS ===');
  if (!expired && spaceResp.status === 200 && spacesReadOpen) {
    console.log('✅ Everything looks correct server-side.');
    console.log('   If users still see permission errors, it is likely:');
    console.log('   a) The user is NOT signed in when they click the link.');
    console.log('   b) The join happens BEFORE Firebase Auth is fully initialized.');
    console.log('   c) The invite was created before spaceTitle was stored, causing getInviteInfo() to try reading the space directly.');
  } else {
    if (expired) console.log('❌ Token is EXPIRED.');
    if (spaceResp.status !== 200) console.log('❌ Space does not exist.');
    if (!spacesReadOpen) console.log('❌ Firestore rules are WRONG — spaces still locked to members only.');
  }
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
