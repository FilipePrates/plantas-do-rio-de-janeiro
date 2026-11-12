import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const root = resolve(import.meta.dirname, '..');
const directory = join(root, 'dist/web');
const hash = value => createHash('sha256').update(value).digest('hex');
const catalogBytes = readFileSync(join(root, 'src/data/plants.json'));
const catalog = JSON.parse(catalogBytes);
const thumbnails = JSON.parse(readFileSync(join(root, 'src/data/plant-thumbnail-manifest.json'), 'utf8'));
const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)]);
const files = walk(directory);
const actualMedia = new Set(files.filter(path => /\.(?:jpg|jpeg|png|webp)$/i.test(path)).map(path => hash(readFileSync(path))));
const photos = catalog.plants.flatMap(plant => plant.photos);
for (const photo of photos) assert.ok(actualMedia.has(photo.sha256), `Missing original photo: ${photo.fileName}`);
for (const thumbnail of Object.values(thumbnails)) assert.ok(actualMedia.has(thumbnail.sha256), `Missing preview: ${thumbnail.fileName}`);
const expected = new Set(catalog.plants.flatMap(plant => [plant.scientificName, plant.description, plant.identification, plant.ecology, ...plant.photos.map(photo => photo.caption)]).filter(value => value.trim()));
const literals = new Set();
const bundles = [];
for (const path of files.filter(path => path.endsWith('.js'))) {
  const bytes = readFileSync(path);
  const ast = parse(bytes.toString('utf8'), { sourceType: 'unambiguous' });
  const stack = [ast];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'StringLiteral') literals.add(node.value);
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'extra', 'comments', 'tokens'].includes(key)) continue;
      if (Array.isArray(value)) stack.push(...value);
      else if (value && typeof value === 'object') stack.push(value);
    }
  }
  bundles.push({ path: '/' + relative(directory, path).replaceAll('\\', '/'), sha256: hash(bytes), bytes: bytes.length });
}
for (const value of expected) assert.ok(literals.has(value), `Current catalog text missing: ${value.slice(0, 100)}`);
assert.ok(literals.has('Atualizando resultados'), 'Search loading indicator missing');
assert.ok(!files.some(path => /\.(?:apk|aab|keystore|jks|pem)$/i.test(path)), 'Unexpected private/native artifact in web export');
const result = { catalogSha256: hash(catalogBytes), entries: catalog.plants.length,
  representedSpecies: new Set(catalog.plants.flatMap(plant => plant.rank === 'genus' ? plant.regionalSpecies.map(member => member.scientificName) : [plant.scientificName])).size,
  originalPhotos: photos.length, thumbnails: Object.keys(thumbnails).length, currentCatalogStringsVerified: expected.size,
  allMediaHashesVerified: true, searchLoadingIndicatorVerified: true, bundles, htmlSha256: hash(readFileSync(join(directory, 'index.html'))) };
writeFileSync(join(root, 'backups/web-deploy-2026-11-11/export-verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
