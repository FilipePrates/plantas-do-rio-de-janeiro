import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseCatalog, representedSpeciesCount, inaturalistPhotoRights } from "../src/catalog.mjs";
import { beforeCactusProfileReview } from "./helpers/cactaceae.mjs";
import { beforePriorityBatchReview } from "./helpers/priority-batch.mjs";
import { beforeFamilyGapReview } from "./helpers/family-gaps.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const before = read("../sources/cactaceae-2026-11-11/catalog-before.json");
const catalog = read("../src/data/plants.json");
const audit = read("../sources/cactaceae-2026-11-11/audit.json");
const addedIds = new Set(audit.addedPlantIds);

test("cactus expansion preserves all prior records except the explicitly audited profile text", () => {
  const previousIds = new Set(before.plants.map(plant => plant.id));
  const historical = { ...catalog, plants: catalog.plants.filter(plant => previousIds.has(plant.id) || addedIds.has(plant.id)).map(beforeFamilyGapReview).map(beforePriorityBatchReview) };
  const restored = { ...historical, plants: historical.plants.filter((plant) => !addedIds.has(plant.id)).map(beforeCactusProfileReview) };
  assert.deepEqual(restored, before);
  assert.equal(audit.updatedProfiles.length, 3);
  assert.equal(audit.addedPlantIds.length, 14);
  assert.equal(representedSpeciesCount(parseCatalog(historical)), representedSpeciesCount(before) + 14);
  for (const change of audit.updatedProfiles) {
    assert.deepEqual(Object.keys(change.after).sort(), ["curationNotes", "description", "ecology", "identification", "reviewStatus", "sources"]);
    assert.equal(change.after.reviewStatus, "draft");
  }
});

test("new cactus profiles have species-specific sources, images and visually recorded captions and tags", () => {
  const photoAudit = new Map(audit.newPhotos.map((photo) => [photo.photoId, photo]));
  assert.equal(photoAudit.size, 33);
  assert.ok(audit.originalMediaBytesAdded < 25 * 1024 * 1024);
  let total = 0;
  for (const plant of catalog.plants.filter((item) => addedIds.has(item.id))) {
    assert.equal(plant.family, "Cactaceae");
    assert.equal(plant.reviewStatus, "draft");
    assert.equal(plant.geography, "rio-state");
    assert.ok(plant.photos.length >= 2);
    assert.ok(plant.sources.length >= 2);
    for (const field of ["description", "identification", "ecology"]) assert.ok(plant[field].length >= 200, `${plant.id}: ${field}`);
    for (const photo of plant.photos) {
      total++;
      const row = photoAudit.get(photo.photoId);
      assert.equal(row.visualInspection, true);
      assert.equal(photo.caption, row.caption);
      assert.deepEqual(photo.markers, row.markers);
      assert.equal(photo.reviewStatus, "draft");
      const evidence = read(`../sources/inaturalist/photos/${photo.photoId}.json`);
      assert.equal(photo.sha256, evidence.download.sha256);
      assert.equal(photo.taxonName, evidence.observation.taxon.name);
      assert.equal(evidence.observation.quality_grade, "research");
      for (const [key, value] of Object.entries(inaturalistPhotoRights(evidence.photo))) assert.equal(photo[key], value);
      // Selected flattened/columnar cactus stems are never tagged as leaves.
      if (photo.markers.includes("leaf")) assert.equal(plant.genus, "Pereskia");
      if (photo.taxonName !== plant.scientificName) {
        assert.equal(plant.scientificName, "Hatiora salicornioides");
        assert.equal(photo.taxonName, "Hatiora salicornoides");
        assert.ok(plant.alternateNames.includes(photo.taxonName));
      }
    }
  }
  assert.equal(total, photoAudit.size);
});
