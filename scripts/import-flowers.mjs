import assert from 'node:assert/strict';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Usage: node scripts/import-flowers.mjs [source-directory] [--verify]
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
assert(args.filter((arg) => arg !== '--verify').length <= 1, 'Expected one source directory');
const source = path.resolve(args.find((arg) => arg !== '--verify') ??
  path.join(homedir(), 'Desktop', 'ЦВЕТОЧНЫЙ_МИР_24_7_Грязи'));
const catalogDir = path.join(source, '01_КАТАЛОГ_ТОВАРОВ');
const outputDir = path.join(root, 'public', 'flowers');
const dataPath = path.join(root, 'lib', 'flowers.json');
const catalog = JSON.parse(await readFile(path.join(catalogDir, 'Каталог_товаров.json'), 'utf8'));
assert(Array.isArray(catalog) && catalog.length === 40, 'Expected exactly 40 source products');

function price(value) {
  assert.equal(typeof value, 'string', 'Source price must be a string');
  const normalized = value.replace(/\s/gu, '');
  assert(/^\d+₽$/u.test(normalized), `Invalid source price: ${value}`);
  const amount = Number(normalized.slice(0, -1));
  assert(Number.isSafeInteger(amount) && amount > 0, `Invalid price amount: ${value}`);
  return amount;
}

const jobs = [];
const ids = new Set();
const products = catalog.map((product) => {
  assert(Number.isSafeInteger(product.id) && product.id > 0 && !ids.has(product.id), 'Invalid or duplicate ID');
  ids.add(product.id);
  assert.equal(typeof product.title, 'string');
  assert.equal(typeof product.description, 'string');
  assert(Array.isArray(product.photos) && product.photos.length > 0, `Missing photos: ${product.id}`);
  const name = product.title
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\u200D\uFE0F\u20E3]/gu, '')
    .replace(/\s+/gu, ' ').trim();
  assert(name.length > 0, `Empty product name: ${product.id}`);
  const category = /свадеб|невест/iu.test(name) ? 'Свадебные'
    : /корзин|короб|сумоч|сумк/iu.test(name) ? 'Корзины и коробки'
      : /(?:^|[^\p{L}])роз(?:а|ы|у|е|ой|ами|ах)?(?:$|[^\p{L}])/iu.test(name) ? 'Розы'
        : 'Букеты';
  const images = product.photos.map((photo, index) => {
    // The Windows export strips trailing dots/spaces from directory names.
    const input = path.resolve(catalogDir, ...photo.split(/[\\/]/u).map((part) =>
      part === '.' || part === '..' ? part : part.replace(/[. ]+$/u, '')));
    const relative = path.relative(catalogDir, input);
    assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Photo must be inside source catalog');
    const filename = `product-${product.id}-${index + 1}.webp`;
    jobs.push({ input, filename });
    return `/flowers/${filename}`;
  });
  return {
    id: product.id,
    name,
    description: product.description,
    price: price(product.price),
    oldPrice: product.old_price === '' ? null : price(product.old_price),
    category,
    images,
  };
});

jobs.push({
  input: path.join(source, '00_О_МАГАЗИНЕ_И_КОНТАКТЫ', 'Флорист_Наталья_Кашина.jpg'),
  filename: 'florist.webp',
});
// Captions identify these as September bouquets, daily bouquets, and a basket.
for (const [index, filename] of [
  'Работа_010_2026-08-28.jpg',
  'Работа_028_2026-08-20.jpg',
  'Работа_045_2026-06-25.jpg',
].entries()) {
  jobs.push({
    input: path.join(source, '02_ФОТОАЛЬБОМЫ_И_РАБОТЫ', filename),
    filename: `story-${index + 1}.webp`,
  });
}

// Preflight every source before replacing any generated asset.
for (const job of jobs) {
  await access(job.input);
  const metadata = await sharp(job.input).metadata();
  assert(metadata.width > 0 && metadata.height > 0, `Invalid source image: ${job.input}`);
}

if (!args.includes('--verify')) {
  await mkdir(outputDir, { recursive: true });
  await mkdir(path.dirname(dataPath), { recursive: true });
  for (const job of jobs) {
    await sharp(job.input)
      .rotate()
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, job.filename));
  }
  await writeFile(dataPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
}

const imported = JSON.parse(await readFile(dataPath, 'utf8'));
assert.deepEqual(imported, products, 'Generated catalog differs from source transformation');
const dimensions = [];
for (const job of jobs) {
  const image = sharp(path.join(outputDir, job.filename));
  const metadata = await image.metadata();
  assert.equal(metadata.format, 'webp', `Not WebP: ${job.filename}`);
  assert(metadata.width > 0 && metadata.height > 0 && metadata.width <= 1400 && metadata.height <= 1400,
    `Invalid dimensions: ${job.filename}`);
  await image.stats(); // Decode pixels as well as checking the header.
  dimensions.push({ file: `/flowers/${job.filename}`, width: metadata.width, height: metadata.height });
}

console.log(JSON.stringify({
  products: imported.length,
  productImages: jobs.length - 4,
  totalImages: jobs.length,
  categories: Object.fromEntries(['Букеты', 'Розы', 'Корзины и коробки', 'Свадебные']
    .map((category) => [category, imported.filter((product) => product.category === category).length])),
  priceRange: [Math.min(...imported.map((product) => product.price)), Math.max(...imported.map((product) => product.price))],
  dimensions,
}, null, 2));
