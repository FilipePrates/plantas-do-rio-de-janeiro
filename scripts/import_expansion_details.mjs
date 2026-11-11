// Additional views from the same observations, through the editor's verified
// importer. Run only after the general downloader has finished writing plants.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInaturalistService } from "../../plantas-rio-content-editor/server/inaturalist.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const service = createInaturalistService({ appRoot: root, editorRoot: resolve(root, "../plantas-rio-content-editor") });
const catalogPath = resolve(root, "src/data/plants.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const tasks = [
  ["Anthurium comtum", 361317677, [659396278]],
  ["Anthurium longifolium", 229591351, [407554181, 407554229, 407554269, 407554324]],
  ["Eugenia candolleana", 202651643, [357936149, 357936210, 357936270]],
  ["Quesnelia marmorata", 145888607, [250690455, 250690464]],
  ["Tillandsia geminiflora", 198104081, [349085822, 349085838]],
];
for (const [name, observationId, ids] of tasks) {
  const plant = catalog.plants.find((p) => p.scientificName === name);
  const used = new Set(catalog.plants.flatMap((p) => p.photos.map((ph) => ph.photoId)));
  const photoIds = ids.filter((id) => !used.has(id));
  if (!photoIds.length) continue;
  const inspected = await service.inspect(String(observationId));
  if (inspected.qualityGrade !== "research" || inspected.taxonName !== name ||
      !photoIds.every((id) => inspected.photos.some((ph) => ph.id === id)))
    throw new Error(`Observation identification, quality or eligible rights changed: ${name}`);
  const photos = await service.importPhotos({ observationId, photoIds, plant });
  if (!photos.every((ph) => ph.taxonName === name && ph.reviewStatus === "draft"))
    throw new Error(`Imported evidence mismatch: ${name}`);
  plant.photos.push(...photos);
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`${name}: ${photos.length} complementary views`);
}
