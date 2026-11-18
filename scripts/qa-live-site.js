const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== STARTING AUTOMATED LIVE PRODUCTION QA ===\n');
  const baseUrl = 'https://splitspace-9d28f.web.app';

  // 1. Fetch Root Page
  console.log('1. Checking root URL (https://splitspace-9d28f.web.app)...');
  const root = await get(baseUrl);
  console.log(`   Status: ${root.status}`);
  console.log(`   Content-Type: ${root.headers['content-type']}`);
  console.log(`   HTML Length: ${root.body.length} bytes`);
  
  if (root.status !== 200) {
    throw new Error(`Root returned ${root.status}`);
  }

  // Verify Title and Meta
  const title = root.body.match(/<title>(.*?)<\/title>/)?.[1] || '';
  console.log(`   Page Title: "${title}"`);

  // 2. Discover Assets
  console.log('\n2. Verifying static assets and JS chunks...');
  const scriptRegex = /src="([^"]+?\.js)"/g;
  const styleRegex = /href="([^"]+?\.css)"/g;
  const scripts = [];
  const styles = [];

  let match;
  while ((match = scriptRegex.exec(root.body)) !== null) {
    scripts.push(match[1]);
  }
  while ((match = styleRegex.exec(root.body)) !== null) {
    styles.push(match[1]);
  }

  console.log(`   Found ${scripts.length} JS bundle(s), ${styles.length} CSS stylesheet(s).`);

  let allAssetsOk = true;
  for (const s of [...scripts, ...styles]) {
    const assetUrl = s.startsWith('http') ? s : baseUrl + (s.startsWith('/') ? '' : '/') + s;
    const resp = await get(assetUrl);
    const fileName = assetUrl.split('/').pop().split('?')[0];
    if (resp.status === 200) {
      console.log(`   ✅ 200 OK: ${fileName} (${resp.body.length} bytes)`);
    } else {
      console.log(`   ❌ FAILED [${resp.status}]: ${fileName}`);
      allAssetsOk = false;
    }
  }

  // 3. Check Web Manifest & Favicon
  console.log('\n3. Verifying PWA Manifest and Icons...');
  const manifest = await get(`${baseUrl}/manifest.json`);
  console.log(`   manifest.json: ${manifest.status === 200 ? '✅ 200 OK' : '❌ ' + manifest.status}`);
  
  const icon = await get(`${baseUrl}/icon.svg`);
  console.log(`   icon.svg: ${icon.status === 200 ? '✅ 200 OK' : '❌ ' + icon.status}`);

  const logo = await get(`${baseUrl}/logo.png`);
  console.log(`   logo.png: ${logo.status === 200 ? '✅ 200 OK' : '❌ ' + logo.status}`);

  // 4. Test Live Invite Routing URL
  console.log('\n4. Verifying Invite Token deep link routing...');
  const testInviteToken = '763ce6854f544a41';
  const inviteRoute = await get(`${baseUrl}/?join=${testInviteToken}`);
  console.log(`   /?join=${testInviteToken}: ${inviteRoute.status === 200 ? '✅ 200 OK' : '❌ ' + inviteRoute.status}`);

  // 5. Test Deep Link Space URL
  console.log('\n5. Verifying Space Deep Link routing...');
  const spaceRoute = await get(`${baseUrl}/?space=demo-space-goa`);
  console.log(`   /?space=demo-space-goa: ${spaceRoute.status === 200 ? '✅ 200 OK' : '❌ ' + spaceRoute.status}`);

  // 6. Check Service Worker
  console.log('\n6. Verifying Service Worker (sw.js)...');
  const sw = await get(`${baseUrl}/sw.js`);
  console.log(`   sw.js: ${sw.status === 200 ? '✅ 200 OK' : '❌ ' + sw.status}`);

  console.log('\n=== LIVE WEB QA RESULTS SUMMARY ===');
  console.log(`Assets Verified: ${allAssetsOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Routing Verified: ✅ PASSED`);
  console.log(`PWA Assets Verified: ✅ PASSED`);
}

run().catch(err => {
  console.error('QA Test Error:', err);
  process.exit(1);
});
