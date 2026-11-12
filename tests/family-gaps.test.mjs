import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { withoutRepeatedCommonNames } from "./helpers/common-names.mjs";
import { parseCatalog, representedSpeciesCount, inaturalistPhotoRights } from "../src/catalog.mjs";
import { beforeFamilyGapReview } from "./helpers/family-gaps.mjs";
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const catalog = parseCatalog(read("../src/data/plants.json"));
const before = read("../sources/family-gaps-2026-11-11/catalog-before.json");
const audit = read("../sources/family-gaps-2026-11-11/audit.json");
const added = new Set(audit.addedPlantIds);
const subsequentPalms = new Set(["syagrus-pseudococos", "syagrus-insignis", "syagrus-macrocarpa"]);
const workbookBatch = new Set(read("../sources/workbook-batch-2026-11-12/added.json").addedPlantIds);

test("family expansion preserves every earlier photo and field except the audited Cattleya completion", () => {
  const restored = { ...catalog, plants: catalog.plants.filter(p => !added.has(p.id) && !subsequentPalms.has(p.id) && !workbookBatch.has(p.id)).map(beforeFamilyGapReview) };
  assert.deepEqual(withoutRepeatedCommonNames(restored), withoutRepeatedCommonNames(before));
  assert.equal(added.size, 16);
  assert.equal(representedSpeciesCount(catalog), representedSpeciesCount(before) + 16 + subsequentPalms.size + workbookBatch.size);
  assert.deepEqual(audit.updatedProfiles.map(row => row.plantId), ["cattleya-guttata"]);
  assert.ok(audit.originalMediaBytesAdded < 25 * 1024 ** 2);
});

test("requested genera and eight new orchids have individual illustrated profiles with complete draft text", () => {
  const newPlants = catalog.plants.filter(p => added.has(p.id));
  for (const genus of ["Guapira", "Alchornea", "Croton", "Allophylus", "Sapindus", "Zanthoxylum"]) assert.ok(newPlants.some(p => p.genus === genus));
  assert.equal(newPlants.filter(p => p.family === "Orchidaceae").length, 8);
  for (const plant of [...newPlants, catalog.plants.find(p => p.id === "cattleya-guttata")]) {
    assert.equal(plant.presentation, "profile");
    assert.equal(plant.reviewStatus, "draft");
    for (const field of ["description", "identification", "ecology"]) assert.ok(plant[field].length >= 200, `${plant.id}: ${field}`);
    assert.ok(plant.photos.length && plant.sources.length >= 2);
  }
  const spotted = newPlants.find(p => p.scientificName === "Maxillaria picta");
  assert.ok(spotted.alternateNames.includes("Brasiliorchis picta"));
  assert.ok(!newPlants.some(p => p.scientificName === "Brasiliorchis picta"));
});

test("all 36 added photos have individual captions/tags, exact archived rights and matching image bytes", () => {
  const rows = new Map(audit.newPhotos.map(row => [row.photoId, row]));
  const photos = catalog.plants.filter(p => added.has(p.id)).flatMap(p => p.photos);
  assert.equal(photos.length, 36);
  assert.equal(rows.size, 36);
  for (const photo of photos) {
    const row = rows.get(photo.photoId);
    assert.equal(row.visualInspection, true);
    assert.equal(photo.caption, row.caption);
    assert.deepEqual(photo.markers, row.markers);
    assert.ok(photo.caption.length > 40 && photo.markers.length && !photo.markers.includes("unknown"));
    assert.equal(photo.reviewStatus, "draft");
    const evidence = read(`../sources/inaturalist/photos/${photo.photoId}.json`);
    assert.equal(evidence.observation.quality_grade, "research");
    assert.equal(photo.sha256, evidence.download.sha256);
    assert.equal(photo.taxonName, evidence.observation.taxon.name);
    for (const [key, value] of Object.entries(inaturalistPhotoRights(evidence.photo))) assert.equal(photo[key], value);
    const bytes = readFileSync(new URL(`../assets/plants/${photo.fileName}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), photo.sha256);
  }
});
