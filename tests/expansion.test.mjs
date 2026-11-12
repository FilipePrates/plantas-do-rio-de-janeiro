import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checklistRows, isProfile, parseCatalog } from "../src/catalog.mjs";
import { beforeVisualAnnotations } from "./helpers/photo-annotations.mjs";
import { beforePriorityPhotoReview } from "./helpers/priority-batch.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const catalog = read("../src/data/plants.json");
const before = read("../sources/expansion-2026-11-11/catalog-before.json");
const audit = read("../sources/expansion-2026-11-11/curation.json");

test("November expansion preserves previous species and exact photos before the audited annotation pass", () => {
  const names = new Set(checklistRows(catalog).map((r) => r.scientificName));
  for (const row of checklistRows(before)) assert.ok(names.has(row.scientificName), row.scientificName);
  const photos = new Map(catalog.plants.flatMap((p) => p.photos).map((p) => [p.photoId, p]));
  for (const photo of before.plants.flatMap((p) => p.photos)) assert.deepEqual(beforeVisualAnnotations(beforePriorityPhotoReview(photos.get(photo.photoId))), photo);
  parseCatalog(catalog); // Also rejects repeated membership and conflicting legacy IDs.
});

test("new individual profiles have species-specific local photos, botanical text and exact native RJ evidence", () => {
  for (const row of audit.staged) {
    const plant = catalog.plants.find((p) => p.id === row.id);
    assert.ok(plant, row.id);
    assert.equal(plant.reviewStatus, "draft", row.id);
    assert.ok(plant.description.length > 60 && plant.identification.length > 60, row.id);
    assert.ok(plant.sources.length >= 2, row.id);
    if (isProfile(plant)) {
      assert.ok(plant.photos.length, row.id);
      assert.ok(plant.photos.every((ph) => ph.taxonName === plant.scientificName), row.id);
    }
    if (row.action === "new-species" || row.action === "split-genus") {
      const cache = read(`../sources/flora/${plant.scientificName.replaceAll(" ", "_")}.json`);
      assert.ok(cache.data.some((r) => r.taxon.genus + " " + r.taxon.specificepithet === plant.scientificName &&
        r.taxon.taxonrank === "ESPECIE" && r.taxon.taxonomicstatus === "NOME_ACEITO" &&
        r.distribuition?.some((d) => d.locationid === "BR-RJ" && d.establishmentmeans === "Nativa" &&
          d.occurrenceremarks?.phytogeographicDomain?.includes("Mata Atlântica"))), row.id);
    }
    if (plant.geography === "rio-city") {
      assert.ok(plant.municipalEvidence?.length, row.id);
      assert.ok(plant.municipalEvidence.every((e) => e.scientificName === plant.scientificName), row.id);
    }
    if (row.fromGroup) {
      const group = catalog.plants.find((p) => p.id === row.fromGroup);
      assert.ok(!group.regionalSpecies.some((s) => s.scientificName === plant.scientificName));
      assert.ok(!group.photos.some((ph) => ph.taxonName === plant.scientificName));
      assert.ok(!group.previousIds?.includes(plant.id));
    }
  }
});

test("new imported photographs remain drafts with photo-level eligible rights and research-grade provenance", () => {
  const added = new Set(audit.summary.newPhotoIds);
  for (const photo of catalog.plants.flatMap((p) => p.photos).filter((ph) => added.has(ph.photoId))) {
    const evidence = read(`../sources/inaturalist/photos/${photo.photoId}.json`);
    assert.equal(photo.reviewStatus, "draft");
    assert.deepEqual(beforeVisualAnnotations(photo).markers, ["unknown"]);
    assert.ok(["cc0", "cc-by"].includes(evidence.photo.license_code));
    assert.equal(evidence.observation.quality_grade, "research");
    assert.equal(evidence.observation.taxon.name, photo.taxonName);
    assert.equal(evidence.download.sha256, photo.sha256);
  }
});

test("Philodendron reference retains explicit 2026 distribution conflicts without creating confirmed individual profiles", () => {
  const group = catalog.plants.find((p) => p.id === "philodendron-spp");
  assert.match(group.description, /acutatum.*curvilobum/);
  assert.match(group.description, /imbe.*duvidoso/);
  for (const name of ["Philodendron acutatum", "Philodendron curvilobum", "Philodendron imbe"]) {
    assert.ok(group.regionalSpecies.some((s) => s.scientificName === name));
    assert.ok(!catalog.plants.some((p) => p.rank === "species" && p.scientificName === name));
  }
});
