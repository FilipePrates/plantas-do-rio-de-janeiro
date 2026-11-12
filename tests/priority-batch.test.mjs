import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseCatalog, representedSpeciesCount, inaturalistPhotoRights } from "../src/catalog.mjs";
import { beforePriorityBatchReview } from "./helpers/priority-batch.mjs";
import { beforeFamilyGapReview } from "./helpers/family-gaps.mjs";

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const before = read("../sources/begonia-mangrove-2026-11-11/catalog-before.json");
const catalog = parseCatalog(read("../src/data/plants.json"));
const audit = read("../sources/begonia-mangrove-2026-11-11/audit.json");
const newIds = new Set(audit.addedPlantIds);
const priority = ["Andira legalis", "Psidium cattleyanum", "Schinus terebinthifolia", "Cordia superba", "Tabebuia cassinoides",
  "Cedrela fissilis", "Clusia fluminensis", "Melocactus violaceus", "Cecropia glaziovii", "Cecropia hololeuca",
  "Eugenia brasiliensis", "Schizolobium parahyba", "Dalbergia nigra", "Hymenaea courbaril", "Genipa americana",
  "Cariniana estrellensis", "Cariniana legalis", "Syagrus romanzoffiana", "Pleroma mutabile", "Manilkara subsericea",
  "Byrsonima sericea", "Ormosia arborea", "Ceiba speciosa", "Euterpe edulis", "Bauhinia forficata", "Paubrasilia echinata",
  "Eugenia uniflora", "Pleroma granulosum", "Sideroxylon obtusifolium", "Lecythis pisonis"];

test("priority batch preserves every prior field except its enumerated profile and caption edits", () => {
  const historicalIds = new Set([...before.plants.map(p => p.id), ...newIds]);
  const historical = { ...catalog, plants: catalog.plants.filter(p => historicalIds.has(p.id)).map(beforeFamilyGapReview) };
  const restored = { ...historical, plants: historical.plants.filter(p => !newIds.has(p.id)).map(beforePriorityBatchReview) };
  assert.deepEqual(restored, before);
  assert.equal(newIds.size, 26);
  assert.equal(audit.updatedProfiles.length, 12);
  assert.equal(representedSpeciesCount(historical), representedSpeciesCount(before) + 26);
  assert.ok(audit.originalMediaBytesAdded < 35 * 1024 ** 2);
});

test("grumixama caption corrections are restricted to the two audited captions and draft states", () => {
  assert.equal(audit.photoAnnotationCorrections.length, 2);
  for (const change of audit.photoAnnotationCorrections) {
    const photo = catalog.plants.flatMap(p => p.photos).find(photo => photo.photoId === change.photoId);
    assert.deepEqual(Object.keys(change.after).sort(), ["caption", "reviewStatus"]);
    assert.equal(photo.caption, change.after.caption);
    assert.equal(photo.reviewStatus, "draft");
    assert.ok(photo.caption.includes("oposta ao pedicelo"));
  }
});

test("all 30 requested trees and the five mangrove comparison species have individual illustrated profiles", () => {
  for (const name of [...priority, "Avicennia schaueriana", "Avicennia germinans", "Laguncularia racemosa", "Rhizophora mangle", "Conocarpus erectus"]) {
    const plant = catalog.plants.find(p => p.scientificName === name);
    assert.ok(plant, name);
    assert.equal(plant.rank, "species", name);
    assert.equal(plant.presentation ?? "profile", "profile", name);
    assert.ok(plant.photos.length && plant.identification.trim() && plant.ecology.trim(), name);
  }
});

test("new photos retain photo-level license evidence, attribution and bytes, with individual draft annotations", () => {
  const rows = new Map(audit.newPhotos.map(row => [row.photoId, row]));
  let count = 0;
  const added = catalog.plants.filter(p => newIds.has(p.id));
  assert.equal(added.filter(p => p.family === "Begoniaceae").length, 11);
  for (const plant of added) {
    assert.equal(plant.reviewStatus, "draft");
    assert.equal(plant.geography, "rio-state");
    for (const field of ["description", "identification", "ecology"]) assert.ok(plant[field].length >= 200, `${plant.id}: ${field}`);
    assert.ok(plant.photos.length && plant.sources.length >= 2);
    for (const photo of plant.photos) {
      count++;
      const row = rows.get(photo.photoId);
      assert.equal(row.visualInspection, true);
      assert.equal(photo.caption, row.caption);
      assert.deepEqual(photo.markers, row.markers);
      assert.equal(photo.reviewStatus, "draft");
      assert.ok(photo.caption.length > 40 && photo.markers.length && !photo.markers.includes("unknown"));
      const evidence = read(`../sources/inaturalist/photos/${photo.photoId}.json`);
      assert.equal(evidence.observation.quality_grade, "research");
      assert.equal(evidence.observation.taxon.name, photo.taxonName);
      assert.equal(photo.sha256, evidence.download.sha256);
      const bytes = readFileSync(new URL(`../assets/plants/${photo.fileName}`, import.meta.url));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), photo.sha256);
      for (const [key, value] of Object.entries(inaturalistPhotoRights(evidence.photo))) assert.equal(photo[key], value);
      if (photo.taxonName !== plant.scientificName) {
        assert.equal(plant.scientificName, "Begonia luxurians");
        assert.ok(plant.alternateNames.includes(photo.taxonName));
      }
      if (plant.family === "Polypodiaceae") assert.ok(!photo.markers.some(marker => ["flower", "fruit", "seed"].includes(marker)));
    }
  }
  assert.equal(count, 52);
  assert.equal(count, rows.size);
});
