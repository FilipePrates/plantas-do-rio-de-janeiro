import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { checklistRows, conservationUnitNames, matchesPlant, parseCatalog } from '../src/catalog.mjs';
import { browserReducer, conservationUnitIndex, filterBrowserRows, initialBrowserState, matchesIndexName, plantsForRows, rowsForConservationUnit } from '../src/catalogBrowser.mjs';

const catalog = parseCatalog(JSON.parse(readFileSync(new URL('../src/data/plants.json', import.meta.url), 'utf8')));
const rows = checklistRows(catalog);

test('unit index is alphabetical and its guide selection contains only recorded members', () => {
  const units = conservationUnitIndex(rows);
  assert.ok(units.length > 0);
  assert.deepEqual(units.map(({ name }) => name), units.map(({ name }) => name).sort((a, b) => a.localeCompare(b, 'pt-BR')));
  for (const { name, speciesCount } of units) {
    const selection = rowsForConservationUnit(rows, name);
    assert.equal(selection.length, speciesCount, name);
    assert.ok(selection.every((row) => conservationUnitNames(row.plant, row.scientificName).includes(name)));
    assert.ok(plantsForRows(selection).length <= speciesCount);
  }
});

test('unit names are searchable in both species and guide, including accent-free queries', () => {
  const unit = conservationUnitIndex(rows).find(({ name }) => /[áàâãéêíóôõúç]/i.test(name)) ?? conservationUnitIndex(rows)[0];
  const query = unit.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  assert.ok(matchesIndexName(unit.name, query));
  const selection = filterBrowserRows(rows, {
    ...initialBrowserState, queries: { ...initialBrowserState.queries, species: query },
  });
  assert.ok(selection.length > 0);
  assert.ok(selection.some((row) => matchesPlant(row.plant, query)));
});

test('family selection returns to its index and preserves searches', () => {
  const searched = browserReducer(initialBrowserState, { type: 'query', query: 'acanth' });
  const selected = browserReducer(searched, { type: 'select', family: 'Acanthaceae' });
  assert.equal(selected.section, 'species');
  assert.equal(selected.origin, 'families');
  assert.ok(filterBrowserRows(rows, selected).every((row) => row.family === 'Acanthaceae'));
  const returned = browserReducer(selected, { type: 'back' });
  assert.equal(returned.section, 'families');
  assert.equal(returned.queries.families, 'acanth');
  const allSpecies = browserReducer(selected, { type: 'tab', section: 'species' });
  assert.equal(allSpecies.family, null);
  assert.equal(allSpecies.origin, null);
});
