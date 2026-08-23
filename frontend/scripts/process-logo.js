const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processLogo() {
  const inputPath = "C:\\Users\\Ashish\\.gemini\\antigravity-ide\\brain\\9a104516-3d15-4f82-b292-d1447c8f1c9a\\.user_uploaded\\media_1787471819439.png";
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  if (!fs.existsSync(inputPath)) {
    console.error("Input file not found:", inputPath);
    return;
  }

  console.log("Processing logo from:", inputPath);

  // 1. Trim outer padding from original image
  const trimmedBuffer = await sharp(inputPath)
    .trim({
      background: { r: 254, g: 253, b: 247, alpha: 1 },
      threshold: 30
    })
    .toBuffer();

  const metadata = await sharp(trimmedBuffer).metadata();
  console.log(`Trimmed dimensions: ${metadata.width}x${metadata.height}`);

  // 2. Center inside a square canvas with subtle 4% padding for circular harmony
  const maxDim = Math.max(metadata.width, metadata.height);
  const padding = Math.round(maxDim * 0.04);
  const targetSize = maxDim + padding * 2;

  // Make the background transparent by converting near-white / ivory background to transparent or keeping it crisp
  const rawImage = await sharp(trimmedBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = rawImage;
  // Replace background color (near #fffef9 or ivory) with transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // If pixel is near off-white/cream background
    if (r > 240 && g > 235 && b > 220) {
      data[i + 3] = 0; // Transparent
    }
  }

  const transparentBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toBuffer();

  // Create square 512x512 high-res logo
  const logo512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: await sharp(transparentBuffer)
      .resize(480, 480, { fit: 'inside' })
      .toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toBuffer();

  // Save to public destinations
  fs.writeFileSync(path.join(publicDir, 'logo.png'), logo512);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), logo512);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), logo512);
  fs.writeFileSync(path.join(appDir, 'icon.png'), logo512);

  // Also create a circular badge version with a warm glow container for favicons
  console.log("Generated high-res 512x512 logo and app icons successfully!");
}

processLogo().catch(err => {
  console.error("Error processing logo:", err);
});
