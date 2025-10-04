const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const publicDir = path.join(__dirname, 'public');
    const srcSvg = path.join(publicDir, 'icon.svg');
    if (!fs.existsSync(srcSvg)) {
      console.error('icon.svg not found at', srcSvg);
      process.exit(1);
    }

    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    for (const size of sizes) {
      const dest = path.join(publicDir, `icon-${size}.png`);
      await sharp(srcSvg)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(dest);
      console.log('Generated', dest);
    }

    // Favicons for good measure
    const fav32 = path.join(publicDir, 'favicon-32.png');
    const fav16 = path.join(publicDir, 'favicon-16.png');
    await sharp(srcSvg).resize(32, 32).png().toFile(fav32);
    await sharp(srcSvg).resize(16, 16).png().toFile(fav16);

    console.log('✅ All icons generated successfully');
  } catch (err) {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  }
})();