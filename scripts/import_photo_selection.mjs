// Exact visually selected images only, through the plant editor's rights importer.
// Writes the separate draft catalog, never canonical data. Resumable by photo ID.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInaturalistService } from '../../plantas-rio-content-editor/server/inaturalist.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const folder = resolve(root, 'sources/photo-selection-2026-11-11');
const draftPath = resolve(folder, 'drafts.json');
const catalog = JSON.parse(readFileSync(draftPath, 'utf8'));
const selection = JSON.parse(readFileSync(resolve(folder, 'selection.json'), 'utf8'));
const baseline = JSON.parse(readFileSync(resolve(folder, 'catalog-before.json'), 'utf8'));
const oldIds = new Set(baseline.plants.flatMap(p => p.photos.map(ph => ph.photoId)));
const service = createInaturalistService({ appRoot: root, editorRoot: resolve(root, '../plantas-rio-content-editor') });
const cost = () => catalog.plants.flatMap(p => p.photos).filter(ph => !oldIds.has(ph.photoId)).reduce((n, ph) => n + statSync(resolve(root, 'assets/plants', ph.fileName)).size, 0);

for (const action of selection.actions) {
  const plant = catalog.plants.find(p => p.id === action.id);
  for (const task of action.selectedPhotos) {
    if (plant.photos.some(ph => ph.photoId === task.photoId)) continue;
    const inspected = await service.inspect(String(task.observationId));
    if (inspected.qualityGrade !== 'research' || inspected.taxonName !== plant.scientificName || !inspected.photos.some(ph => ph.id === task.photoId))
      throw new Error(`Identification/rights changed: ${plant.scientificName} / ${task.photoId}`);
    const imported = await service.importPhotos({ observationId: task.observationId, photoIds: [task.photoId], plant });
    if (imported.length !== 1 || imported[0].taxonName !== plant.scientificName || imported[0].reviewStatus !== 'draft' || JSON.stringify(imported[0].markers) !== '["unknown"]')
      throw new Error('Imported evidence/markers mismatch');
    const size = statSync(resolve(root, 'assets/plants', imported[0].fileName)).size;
    if (cost() + size > selection.mediaBudgetBytes) throw new Error('New-media budget exceeded; revise selection before continuing.');
    plant.photos.push(...imported);
    writeFileSync(draftPath, JSON.stringify(catalog, null, 2) + '\n');
    console.log(`${plant.scientificName}: ${task.photoId}; ${(cost() / 1048576).toFixed(2)} MiB cumulative`);
    await new Promise(done => setTimeout(done, 1100));
  }
}
