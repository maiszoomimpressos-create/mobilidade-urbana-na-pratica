/**
 * Remove fundo branco de um PNG: pixels brancos ou quase brancos ficam transparentes.
 * Uso: node scripts/remove-white-bg-icon.cjs [arquivo_entrada] [arquivo_saida]
 * Padrão: apps/passenger/assets/images/macaneta-icon.png (entrada e saída)
 */
const { Jimp } = require('jimp');
const path = require('path');

const root = path.resolve(__dirname, '..');
const inputPath = process.argv[2] || path.join(root, 'apps/passenger/assets/images/macaneta-icon.png');
const outputPath = process.argv[3] || inputPath;

const THRESHOLD = 235; // RGB >= THRESHOLD vira transparente (só o ícone preto fica)

async function main() {
  const image = await Jimp.read(inputPath);
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
      image.bitmap.data[idx + 3] = 0;
    }
  });
  await image.write(outputPath);
  console.log('Fundo branco removido:', outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
