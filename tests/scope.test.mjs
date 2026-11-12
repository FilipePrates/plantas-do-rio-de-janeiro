import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { beforeVisualAnnotations } from "./helpers/photo-annotations.mjs";
import { beforePriorityPhotoReview } from "./helpers/priority-batch.mjs";
import { checklistRows, hasMunicipalEvidence, matchesChecklistRow, matchesPlant,
  parseCatalog, representedSpeciesCount, resolveSavedIds } from "../src/catalog.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const catalog = read("../src/data/plants.json");
const before = read("../sources/scope-2026-10-24/catalog-before.json");
const evidence = read("../sources/scope-2026-10-24/evidence.json");
const audit = read("../docs/scope-audit-2026-10-24.json");

test("scope curation preserves every previous species and every photo with its rights and review", () => {
  const names = new Set(checklistRows(catalog).map((r) => r.scientificName));
  for (const row of checklistRows(before)) assert.ok(names.has(row.scientificName), row.scientificName);
  const photos = (c) => c.plants.flatMap((p) => p.photos).sort((a, b) => a.photoId - b.photoId);
  const previousPhotos = photos(before);
  const previousPhotoIds = new Set(previousPhotos.map((photo) => photo.photoId));
  // Preserve the scope migration's originals without freezing later additions.
  assert.deepEqual(photos(catalog).filter((photo) => previousPhotoIds.has(photo.photoId)).map(beforePriorityPhotoReview).map(beforeVisualAnnotations), previousPhotos);
  assert.equal(representedSpeciesCount(parseCatalog(catalog)), names.size);
  for (const group of catalog.plants.filter((p) => p.rank === "genus")) {
    const members = new Set(group.regionalSpecies.map((s) => s.scientificName));
    for (const photo of group.photos) assert.ok(members.has(photo.taxonName));
  }
});

test("every spreadsheet candidate has one explicit decision and remains traceable to its row", () => {
  const rows = audit.candidates.filter((r) => r.workbookRow);
  assert.equal(rows.length, 3114);
  assert.equal(new Set(rows.map((r) => r.scientificName)).size, 3114);
  assert.deepEqual(rows.map((r) => r.workbookRow).sort((a, b) => a - b), Array.from({ length: 3114 }, (_, i) => i + 2));
  for (const row of rows) {
    assert.ok(["individual-page", "genus-group", "reference-checklist", "research-backlog"].includes(row.decision));
    assert.ok(row.reason && row.nextAction);
    assert.equal(row.reviewStatus, "draft");
  }
});

test("archived input and publication hashes match the evidence manifest", () => {
  for (const [file, metadata] of Object.entries(evidence.files)) {
    const bytes = readFileSync(new URL(`../sources/scope-2026-10-24/${file}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), metadata.sha256, file);
    assert.equal(bytes.length, metadata.bytes);
  }
  assert.equal(evidence.records.filter((r) => r.sourceId === "smac-city-2022").length, 348);
});

test("municipal evidence applies to the named member and never spreads across a genus", () => {
  const rows = checklistRows(catalog);
  assert.equal(rows.find((r) => r.scientificName === "Anthurium coriaceum").geography, "rio-city");
  assert.equal(rows.find((r) => r.scientificName === "Anthurium pentaphyllum").geography, "rio-city");
  assert.equal(rows.find((r) => r.scientificName === "Anthurium scandens").geography, "rio-state");
  const group = catalog.plants.find((p) => p.id === "anthurium-spp");
  assert.equal(group.geography, "rio-state");
  assert.ok(hasMunicipalEvidence(group));
  for (const plant of catalog.plants) {
    const original = before.plants.find((p) => p.id === plant.id);
    if (plant.geography === "rio-city" && original?.geography !== "rio-city") {
      assert.ok(plant.municipalEvidence?.length, plant.id);
      assert.equal(plant.reviewStatus, "draft");
      assert.ok(plant.municipalEvidence.every((e) => !e.source.title.startsWith("Maurenza")));
    }
  }
});

test("reference entries count toward the ceiling and cannot duplicate a grouped member", () => {
  const c = structuredClone(catalog);
  const group = c.plants.find((p) => p.id === "eugenia-spp");
  const member = group.regionalSpecies[0];
  c.plants.push({ ...structuredClone(c.plants.find((p) => p.presentation === "checklist")),
    id: "duplicate-reference", genus: "Eugenia", scientificName: member.scientificName,
    municipalEvidence: [], regionalEvidence: [] });
  assert.throws(() => parseCatalog(c), /duplicada/);
});

test("member searches find their group and checklist search does not match every member", () => {
  const group = catalog.plants.find((p) => p.id === "eugenia-spp");
  assert.ok(matchesPlant(group, "eugenia copacabanensis"));
  const matches = checklistRows(catalog).filter((row) => matchesChecklistRow(row, "eugenia copacabanensis"));
  assert.equal(matches.length, 1);
  assert.equal(matches[0].plant.id, group.id);
});

test("merged profile IDs migrate saved lists without duplicates or lost memberships", () => {
  assert.deepEqual(resolveSavedIds(["eugenia-excelsa", "eugenia-copacabanensis", "eugenia-uniflora", "missing"], catalog.plants),
    ["eugenia-spp", "eugenia-uniflora"]);
  const c = structuredClone(catalog);
  c.plants[0].previousIds = [c.plants[1].id];
  assert.throws(() => parseCatalog(c), /ID anterior/);
});
