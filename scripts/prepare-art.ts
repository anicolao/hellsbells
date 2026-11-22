import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
await mkdir('static/art/cards', { recursive: true });
const files = (await readdir('static/art/v2')).filter(f => f.endsWith('.png'));
const manifest = [];
for (const file of files) {
  const source = 'static/art/v2/' + file;
  const meta = await sharp(source).metadata();
  const id = file.slice(0, -4);
  await sharp(source).resize({ width: ['dealer-button','leads-indicator'].includes(id) ? 384 : id.includes('frame') || id === 'card-back' ? 992 : id.startsWith('suit-') ? 320 : 1200, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100 }).toFile('static/art/cards/' + id + '.webp');
  manifest.push({ id, source, width: meta.width, height: meta.height, hasAlpha: meta.hasAlpha, output: '/art/cards/' + id + '.webp' });
}
await writeFile('static/art/cards/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${files.length} assets; aspect ratios preserved.`);

await import('./prepare-artwork');
