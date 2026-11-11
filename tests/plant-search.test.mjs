import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchesPlant, conservationUnitNames } from "../src/catalog.mjs";
import { createPlantSearch } from "../src/plantSearch.mjs";
const plants = JSON.parse(readFileSync(new URL("../src/data/plants.json", import.meta.url), "utf8")).plants;

test("indexed guide search preserves accents, aliases, grouped members, units and multiword matches", () => {
  const prepare = createPlantSearch(plants);
  const queries = ["", "  ", "juçara", "JUCARA", "imperiale", "mangue preto", "begonia", "cactaceae", "definitely-absent",
    ...plants.flatMap((plant) => [plant.commonName, plant.scientificName, ...plant.alternateNames.slice(0, 1),
      ...plant.regionalSpecies.slice(0, 1).map((member) => member.scientificName), ...conservationUnitNames(plant).slice(0, 1)])];
  for (const query of new Set(queries)) {
    assert.deepEqual(plants.filter(prepare(query)).map((plant) => plant.id), plants.filter((plant) => matchesPlant(plant, query)).map((plant) => plant.id), query);
  }
});

test("mutable editor matching remains fresh and each guide query has independent terms", () => {
  const copy = structuredClone(plants[0]);
  copy.commonName = "unique new editor name";
  assert.ok(matchesPlant(copy, "unique new editor name"));
  copy.commonName = "different draft name";
  assert.equal(matchesPlant(copy, "unique new editor name"), false);
  const prepare = createPlantSearch(plants);
  const first = prepare("Cactaceae");
  prepare("Myrtaceae");
  assert.deepEqual(plants.filter(first).map((plant) => plant.id), plants.filter((plant) => plant.family === "Cactaceae").map((plant) => plant.id));
});
