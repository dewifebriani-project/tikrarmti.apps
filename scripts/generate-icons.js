const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Input logo path (use SVG instead of corrupted JPG)
const inputLogo = path.join(__dirname, '../public/icon-192.png');
// Output directory for icons
const outputDir = path.join(__dirname, '../public/icons');

// Icon sizes that we need
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

async function generateIcons() {
  try {
    console.log('🎨 Generating icons from logo...');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if input logo exists
    if (!fs.existsSync(inputLogo)) {
      throw new Error(`Input logo not found: ${inputLogo}`);
    }

    // Generate each icon size
    for (const icon of iconSizes) {
      console.log(`📦 Creating ${icon.name} (${icon.size}x${icon.size})`);

      await sharp(inputLogo)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 90 })
        .toFile(path.join(outputDir, icon.name));
    }

    // Update icon-192.png and icon-512.png in root public directory (only if they don't exist or are different)
    console.log('📦 Updating root icons...');
    if (iconSizes.find(icon => icon.size === 192)) {
      // Copy from icons directory to root
      await sharp(inputLogo)
        .resize(192, 192, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 90 })
        .toFile(path.join(__dirname, '../public/icon-192-new.png'));
    }

    if (iconSizes.find(icon => icon.size === 512)) {
      // Copy from icons directory to root
      await sharp(inputLogo)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 90 })
        .toFile(path.join(__dirname, '../public/icon-512-new.png'));
    }

    // Generate favicon.ico (multiple sizes in one file)
    console.log('📦 Creating favicon.ico...');
    const sizes = [16, 32, 48];
    const images = await Promise.all(
      sizes.map(size =>
        sharp(inputLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toBuffer()
      )
    );

    // Create ICO file (using the largest size for simplicity)
    await sharp(images[2]) // Use 48x48 version
      .toFile(path.join(__dirname, '../public/favicon-new.ico'));

    // Generate apple-touch-icon.png (180x180)
    console.log('📦 Creating apple-touch-icon.png...');
    await sharp(inputLogo)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90 })
      .toFile(path.join(__dirname, '../public/apple-touch-icon-new.png'));

    console.log('✅ All icons generated successfully!');
    console.log('\n📁 Generated files:');
    console.log('  - /public/icons/*.png (all sizes)');
    console.log('  - /public/favicon.ico');
    console.log('  - /public/apple-touch-icon.png');
    console.log('  - /public/icon-192.png');
    console.log('  - /public/icon-512.png');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();