const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  const inputPath = path.join(__dirname, '../public/aina-logo-dark.png');
  const outputPath = path.join(__dirname, '../public/favicon.ico');
  
  try {
    // Create multiple sizes for the ICO file
    // Note: This creates a PNG that browsers will accept as favicon
    // For a true multi-resolution ICO, you'd need a specialized library
    // But modern browsers accept PNG as favicon.ico
    
    // Create a 32x32 version (most common favicon size)
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .png()
      .toFile(outputPath);
    
    console.log('✅ Favicon generated successfully at:', outputPath);
    console.log('Note: This is a PNG file named .ico (browsers accept this)');
    console.log('For a true multi-resolution ICO, use an online tool like favicon.io');
  } catch (error) {
    console.error('Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();

