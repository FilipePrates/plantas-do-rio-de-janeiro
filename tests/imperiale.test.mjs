import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchesPlant, parseCatalog } from "../src/catalog.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const catalog = read("../src/data/plants.json");

test("requested imperial tree is searchable by both names and retains photo identification and CC0 evidence", () => {
  const plant = catalog.plants.find((item) => item.id === "martiusella-imperialis");
  assert.ok(plant);
  assert.equal(plant.scientificName, "Martiusella imperialis");
  assert.ok(matchesPlant(plant, "Chrysophyllum imperiale"));
  assert.ok(matchesPlant(plant, "árvore do imperador"));
  assert.equal(plant.floraId, 75839);
  assert.equal(plant.reviewStatus, "draft");
  assert.equal(plant.photos.length, 1);
  const photo = plant.photos[0];
  const evidence = read(`../sources/inaturalist/photos/${photo.photoId}.json`);
  assert.equal(evidence.photo.license_code, "cc0");
  assert.equal(photo.licenseCode, "cc0");
  assert.equal(photo.taxonName, "Chrysophyllum imperiale");
  assert.equal(photo.sha256, evidence.download.sha256);
  assert.deepEqual(photo.markers, ["wholePlant", "leaf"]);
  assert.ok(photo.caption.trim());
  assert.equal(photo.reviewStatus, "draft");
  assert.equal(catalog.plants.filter((item) => ["Martiusella imperialis", "Chrysophyllum imperiale"].includes(item.scientificName)).length, 1);
  parseCatalog(catalog);
});
