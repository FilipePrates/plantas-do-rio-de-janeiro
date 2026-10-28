import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  markerLabels,
  matchesPlant,
  parseCatalog,
  representedSpeciesCount,
  inaturalistPhotoRights,
  photoLicenseLabel,
  photoLicenseUrl,
} from "../src/catalog.mjs";

const seed = JSON.parse(
  readFileSync(new URL("../src/data/plants.json", import.meta.url), "utf8"),
);
const fresh = () => structuredClone(seed);
test("committed catalog validates and retains the initial priority families", () => {
  const catalog = parseCatalog(fresh());
  for (const family of [
    "Myrtaceae",
    "Bromeliaceae",
    "Arecaceae",
    "Lecythidaceae",
  ])
    assert.ok(catalog.plants.some((p) => p.family === family));
  for (const name of [
    "Leucaena leucocephala",
    "Epipremnum aureum",
    "Tradescantia zebrina",
  ])
    assert.ok(catalog.plants.some((p) => p.scientificName === name));
});
test("search handles accents, alternate names, family names, and multiple terms", () => {
  const plant = seed.plants.find((p) => p.scientificName === "Euterpe edulis");
  assert.ok(matchesPlant(plant, "jucara arecaceae"));
  assert.ok(matchesPlant(plant, "EUTERPE edulis"));
  assert.equal(matchesPlant(plant, "jucara zebrina"), false);
});
test("group membership contributes to the species ceiling and cannot overlap another entry", () => {
  const catalog = fresh();
  const template = catalog.plants[0];
  const group = {
    ...structuredClone(template),
    id: "test-genus",
    genus: "Testus",
    scientificName: "Testus spp.",
    rank: "genus",
    photos: [],
    regionalEvidence: [],
    regionalSpecies: [
      {
        scientificName: "Testus alpha",
        floraId: 1,
        lifeForms: [],
        substrates: [],
      },
      {
        scientificName: "Testus beta",
        floraId: 2,
        lifeForms: [],
        substrates: [],
      },
    ],
  };
  catalog.plants = [group];
  assert.equal(representedSpeciesCount(parseCatalog(catalog)), 2);
  catalog.plants.push({
    ...structuredClone(template),
    id: "test-alpha",
    genus: "Testus",
    scientificName: "Testus alpha",
    photos: [],
    regionalEvidence: [],
  });
  assert.throws(() => parseCatalog(catalog), /duplicada/);
  catalog.plants = [group];
  group.regionalSpecies = Array.from({ length: 1501 }, (_, i) => ({
    scientificName: `Testus species${i}`,
    floraId: i + 1,
    lifeForms: [],
    substrates: [],
  }));
  assert.throws(() => parseCatalog(catalog), /1.500/);
});
test("a genus group must enumerate its regional species", () => {
  const catalog = fresh();
  const plant = catalog.plants[0];
  plant.rank = "genus";
  plant.regionalSpecies = [];
  assert.throws(() => parseCatalog(catalog), /membros/);
});
test("duplicate IDs, missing sources, and invalid origins are rejected", () => {
  const catalog = fresh();
  catalog.plants.push(structuredClone(catalog.plants[0]));
  assert.throws(() => parseCatalog(catalog), /ID/);
  const noSource = fresh();
  noSource.plants[0].sources = [];
  assert.throws(() => parseCatalog(noSource), /fontes/);
  const invalid = fresh();
  invalid.plants[0].origin = "cultivated";
  assert.throws(() => parseCatalog(invalid), /classificação/);
});
const photo = {
  id: "inat-123",
  fileName: "inat-123.jpg",
  photoId: 123,
  observationId: 456,
  taxonId: 789,
  taxonName: seed.plants[0].scientificName,
  creator: "Test observer",
  license: "CC0-1.0",
  licenseCode: "cc0",
  sourceUrl:
    "https://inaturalist-open-data.s3.amazonaws.com/photos/123/large.jpg",
  observationUrl: "https://www.inaturalist.org/observations/456",
  downloadedAt: "2026-10-16T00:00:00Z",
  sha256: "a".repeat(64),
  markers: ["flower"],
  caption: "",
  reviewStatus: "draft",
};
function onePhoto() {
  const catalog = fresh();
  for (const p of catalog.plants) p.photos = [];
  catalog.plants[0].photos = [structuredClone(photo)];
  return catalog;
}
test("only paired CC0 and CC BY licenses are accepted at photo level", () => {
  assert.ok(parseCatalog(onePhoto()));
  for (const license of ["cc-by", "cc-by-nc", "cc-by-sa", "cc-by-nd", null, ""]) {
    const catalog = onePhoto();
    catalog.plants[0].photos[0].licenseCode = license;
    assert.throws(() => parseCatalog(catalog), /CC0/);
  }
});
test("CC BY round-trips with supplied attribution and exact source/license links", () => {
  const catalog = onePhoto();
  const rights = inaturalistPhotoRights({ id: 123, license_code: "cc-by", attribution: "(c) Photo author, some rights reserved (CC BY)" });
  Object.assign(catalog.plants[0].photos[0], rights);
  assert.deepEqual(parseCatalog(JSON.parse(JSON.stringify(catalog))), catalog);
  assert.equal(rights.creator, "Photo author");
  assert.equal(photoLicenseLabel(catalog.plants[0].photos[0]), "CC BY 4.0");
  assert.equal(photoLicenseUrl(catalog.plants[0].photos[0]), "https://creativecommons.org/licenses/by/4.0/");
  for (const [field, invalid] of [["attribution", ""], ["licenseUrl", "https://creativecommons.org/licenses/by-nc/4.0/"], ["photoPageUrl", "https://www.inaturalist.org/photos/999"]]) {
    const changed = structuredClone(catalog);
    changed.plants[0].photos[0][field] = invalid;
    assert.throws(() => parseCatalog(changed), /CC BY/);
  }
  for (const code of ["cc-by-nc", "cc-by-sa", "cc-by-nd", undefined])
    assert.throws(() => inaturalistPhotoRights({ id: 123, license_code: code, attribution: "Credit" }));
  assert.throws(() => inaturalistPhotoRights({ id: 123, license_code: "cc-by" }), /atribuição/);
});
test("path traversal, arbitrary hosts, and bird markers are rejected", () => {
  for (const [key, value] of [
    ["fileName", "../../secrets.jpg"],
    ["sourceUrl", "https://example.com/photos/123/large.jpg"],
    ["markers", ["female"]],
  ]) {
    const catalog = onePhoto();
    catalog.plants[0].photos[0][key] = value;
    assert.throws(() => parseCatalog(catalog));
  }
  assert.equal(markerLabels.flower, "Flor");
  assert.equal(markerLabels.fruit, "Fruto");
});

test("classification is editable beyond the initial five invasive selections", () => {
  const catalog = fresh();
  for (const plant of catalog.plants.slice(0, 7)) plant.origin = "invasive";
  assert.ok(
    parseCatalog(catalog).plants.filter((p) => p.origin === "invasive").length >
      5,
  );
  catalog.plants[0].origin = "introduced";
  assert.equal(parseCatalog(catalog).plants[0].origin, "introduced");
});
test("old whole-plant tags migrate without losing browser edits or changing the input", () => {
  const catalog = onePhoto();
  catalog.plants[0].photos[0].markers = ["habit", "leaf"];
  catalog.plants[0].description = "Texto já editado pelo usuário";
  const migrated = parseCatalog(catalog);
  assert.deepEqual(migrated.plants[0].photos[0].markers, [
    "wholePlant",
    "leaf",
  ]);
  assert.equal(migrated.plants[0].description, "Texto já editado pelo usuário");
  assert.deepEqual(catalog.plants[0].photos[0].markers, ["habit", "leaf"]);
  assert.equal(markerLabels.wholePlant, "Planta inteira");
});

test("different observation identifications round-trip for species and genus entries", () => {
  for (const genus of [false, true]) {
    const catalog = onePhoto();
    const target = genus
      ? catalog.plants.find((p) => p.rank === "genus")
      : catalog.plants[0];
    catalog.plants[0].photos = [];
    target.photos = [{ ...photo, taxonName: "Different identification" }];
    const saved = parseCatalog(catalog);
    assert.equal(
      saved.plants.find((p) => p.id === target.id).photos[0].taxonName,
      "Different identification",
    );
    assert.deepEqual(parseCatalog(JSON.parse(JSON.stringify(saved))), saved);
  }
});
