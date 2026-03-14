/**
 * Deixa o ícone totalmente preto: fundo transparente, forma em preto puro (#000).
 * Pixels claros -> transparente; pixels escuros -> preto puro.
 * Uso: node scripts/icon-to-pure-black.cjs [arquivo]
 */
const { Jimp } = require('jimp');
const path = require('path');

const root = path.resolve(__dirname, '..');
const inputPath = process.argv[2] || path.join(root, 'apps/passenger/assets/images/macaneta-icon.png');
const outputPath = process.argv[3] || inputPath;

const LIGHT_THRESHOLD = 200; // Acima disso = transparente (fundo)
// Abaixo = preto puro

async function main() {
  const image = await Jimp.read(inputPath);
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const isLight = r >= LIGHT_THRESHOLD && g >= LIGHT_THRESHOLD && b >= LIGHT_THRESHOLD;
    if (isLight) {
      image.bitmap.data[idx + 3] = 0; // transparente
    } else {
      // preto puro, opaco
      image.bitmap.data[idx] = 0;
      image.bitmap.data[idx + 1] = 0;
      image.bitmap.data[idx + 2] = 0;
      image.bitmap.data[idx + 3] = 255;
    }
  });
  await image.write(outputPath);
  console.log('Ícone em preto puro:', outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
