import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseCatalog } from "../src/catalog.mjs";
import { getPlantName, hasCommonName } from "../src/presentation.mjs";

const fresh = () => JSON.parse(readFileSync(new URL("../src/data/plants.json", import.meta.url), "utf8"));
test("empty common names remain empty through catalog round trips and fall back for display", () => {
  const input = fresh();
  input.plants[0].commonName = "";
  const catalog = parseCatalog(input);
  const plant = parseCatalog(JSON.parse(JSON.stringify(catalog))).plants[0];
  assert.equal(plant.commonName, "");
  assert.equal(hasCommonName(plant), false);
  assert.equal(getPlantName(plant, "common"), plant.scientificName);
  assert.equal(getPlantName(plant, "scientific"), plant.scientificName);
});
test("legacy repeated scientific names normalize without mutating the input", () => {
  const input = fresh();
  const name = input.plants[0].scientificName;
  input.plants[0].commonName = ` ${name.toUpperCase()} `;
  assert.equal(parseCatalog(input).plants[0].commonName, "");
  assert.equal(input.plants[0].commonName, ` ${name.toUpperCase()} `);
  input.plants[0].commonName = "Nome popular";
  const plant = parseCatalog(input).plants[0];
  assert.equal(getPlantName(plant, "common"), "Nome popular");
  assert.equal(hasCommonName(plant), true);
  input.plants[0].commonName = null;
  assert.throws(() => parseCatalog(input), /commonName/);
});
