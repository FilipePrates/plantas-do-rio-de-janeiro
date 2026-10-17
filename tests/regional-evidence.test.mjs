import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseCatalog } from "../src/catalog.mjs";

const seed = JSON.parse(readFileSync(new URL("../src/data/plants.json", import.meta.url), "utf8"));
const fresh = () => structuredClone(seed);
function oneEvidence() {
  const catalog = fresh();
  catalog.plants = [catalog.plants.find((p) => p.scientificName === "Euterpe edulis")];
  return catalog;
}

test("regional evidence round-trips and older catalogs remain valid", () => {
  const catalog = oneEvidence();
  assert.deepEqual(parseCatalog(catalog), catalog);
  delete catalog.plants[0].regionalEvidence;
  assert.ok(parseCatalog(catalog));
});

test("a group's conservation evidence must identify a listed species", () => {
  const catalog = fresh();
  const group = catalog.plants.find((p) => p.rank === "genus");
  group.regionalEvidence[0].scientificName = group.scientificName;
  assert.throws(() => parseCatalog(catalog), /espécie ou fonte/);
});

test("conservation evidence requires scope, year, category, and page provenance", () => {
  for (const mutation of [
    (e) => { e.conservationAssessments[0].scope = "municipal"; },
    (e) => { delete e.conservationAssessments[0].referenceYear; },
    (e) => { e.conservationAssessments[0].referenceYear = 2025; },
    (e) => { e.conservationAssessments[0].category = "safe"; },
    (e) => { e.conservationUnits[0].sourcePage = 0; },
    (e) => { e.conservationUnits[0].municipality = "Rio de Janeiro"; delete e.conservationUnits[0].municipalitySourcePage; },
    (e) => { e.endemicToRioState = false; },
    (e) => { e.source.url = "javascript:alert(1)"; },
  ]) {
    const catalog = oneEvidence();
    mutation(catalog.plants[0].regionalEvidence[0]);
    assert.throws(() => parseCatalog(catalog));
  }
});

test("imported categories and UC vouchers agree with archived source rows", () => {
  const archive = JSON.parse(readFileSync(new URL("../sources/rio-conservation/uc-flora-2018.json", import.meta.url), "utf8"));
  for (const plant of seed.plants) for (const evidence of plant.regionalEvidence ?? []) {
    const rows = archive.rows.filter((row) => row.scientificName === evidence.scientificName);
    for (const unit of evidence.conservationUnits) {
      assert.ok(rows.some((row) => row.unit === unit.name && row.sourcePage === unit.sourcePage && row.voucher === unit.voucher));
    }
    for (const assessment of evidence.conservationAssessments) {
      assert.equal(assessment.referenceYear, 2014);
      assert.ok(rows.some((row) => row.sourcePage === assessment.sourcePage && row.category === assessment.category));
    }
  }
});

test("PDF importer respects taxonomic ranks, chapter boundaries, and existing edits", () => {
  execFileSync("python3", [new URL("./rio_uc_import_test.py", import.meta.url).pathname], { stdio: "pipe" });
});
