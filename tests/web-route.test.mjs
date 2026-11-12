import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCatalog, checklistRows } from '../src/catalog.mjs';
import { conservationUnitIndex } from '../src/catalogBrowser.mjs';
import { createWebRouteReader, defaultWebRoute, webRouteSearch, webRoutePageKey, conservationUnitHref } from '../src/webRoute.mjs';
const catalog = parseCatalog(JSON.parse(readFileSync(new URL('../src/data/plants.json', import.meta.url), 'utf8')));
const read = createWebRouteReader(catalog);

test('profile links preserve the selected species and shareable list context without personal display preferences', () => {
  const route = defaultWebRoute();
  route.plantId = 'euterpe-edulis';
  route.query = 'juçara & flor/folha # 1?';
  route.familyFilter = 'Arecaceae';
  route.habitat = catalog.plants.find(plant => plant.id === route.plantId).habitats[0];
  const search = webRouteSearch(route);
  assert.deepEqual(read(search), route);
  for (const key of ['photos', 'sort', 'names', 'mode', 'photo', 'cols']) {
    assert.equal(new URLSearchParams(search).has(key), false);
  }
});

test('a shared catalog selection restores family, section, search and return origin', () => {
  const route = defaultWebRoute();
  route.tab = 'families';
  route.plantId = 'carpotroche-brasiliensis';
  route.browser = { section: 'species', family: 'Achariaceae', origin: 'families', queries: { families: 'acharia', species: 'sapucainha', units: 'tijuca' } };
  assert.deepEqual(read(webRouteSearch(route)), route);
});

test('conservation-unit links encode the actual named unit and filter in a fresh browser', () => {
  const unit = conservationUnitIndex(checklistRows(catalog))[0].name;
  const href = conservationUnitHref(unit);
  assert.ok(href.startsWith('/?'));
  assert.equal(new URL(href, 'https://plantas.avesdobrasil.app').searchParams.get('uc'), unit);
  const route = read(href.slice(1));
  assert.deepEqual(route.scope, { kind: 'unit', name: unit });
  assert.equal(route.tab, 'guide');
  assert.equal(route.plantId, null);
  route.scope = { kind: 'family', name: 'Myrtaceae' };
  assert.deepEqual(read(webRouteSearch(route)), route);
});

test('unknown catalog ids, units, families and invalid display values safely fall back', () => {
  const route = read('?plant=not-a-species&uc=javascript%3Aalert(1)&family=NotAFamily&habitat=nowhere&tab=evil&section=evil&bfamily=evil&cols=-1&photo=evil');
  assert.deepEqual(route, defaultWebRoute());
  assert.equal(read('?utm_source=example'), null);
  assert.equal(read(''), null);
  const renamed = catalog.plants.find(plant => plant.previousIds?.length);
  if (renamed) assert.equal(read(`?plant=${renamed.previousIds[0]}`).plantId, renamed.id);
});

test('legacy display parameters are ignored and removed when a route is serialized again', () => {
  const route = read('?tab=guide&bfamily=Arecaceae&photos=1&sort=family&names=scientific&mode=grid&cols=11&photo=fruit');
  assert.equal(webRouteSearch(route), '?tab=guide&bfamily=Arecaceae');
});

test('typing and display changes do not add page history, while pages and filters do', () => {
  const route = defaultWebRoute();
  const typing = structuredClone(route);
  typing.query = 'palmito';
  assert.equal(webRoutePageKey(route), webRoutePageKey(typing));
  for (const update of [{ plantId: 'euterpe-edulis' }, { tab: 'families' }, { settings: true }, { familyFilter: 'Arecaceae' }, { habitat: 'Floresta Ombrófila' }, { scope: { kind: 'unit', name: 'Tijuca' } }]) {
    assert.notEqual(webRoutePageKey(route), webRoutePageKey({ ...route, ...update }));
  }
});
