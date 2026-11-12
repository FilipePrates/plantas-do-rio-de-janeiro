import { checklistRows, resolveSavedIds } from './catalog.mjs';
import { conservationUnitIndex } from './catalogBrowser.mjs';
import { mainPhotoKinds } from './presentation.mjs';

export function defaultWebRoute() {
  return {
    tab: 'guide', plantId: null, settings: false, query: '', habitat: '', familyFilter: null, scope: null,
    browser: { section: 'families', family: null, origin: null, queries: { families: '', species: '', units: '' } },
    preferences: { photosOnly: true, alphabetical: false, principalName: 'common', advanced: false, mainPhoto: 'default' },
    columns: 10,
  };
}

export function createWebRouteReader(catalog) {
  const families = new Set(catalog.plants.map(plant => plant.family));
  const habitats = new Set(catalog.plants.flatMap(plant => plant.habitats));
  const units = new Set(conservationUnitIndex(checklistRows(catalog)).map(unit => unit.name));
  const recognized = ['plant', 'tab', 'q', 'family', 'habitat', 'uc', 'scopeFamily', 'section', 'bfamily', 'fq', 'sq', 'uq', 'photos', 'sort', 'names', 'mode', 'photo', 'cols', 'settings'];
  return search => {
    const params = new URLSearchParams(search);
    if (!recognized.some(key => params.has(key))) return null;
    const route = defaultWebRoute();
    route.tab = ['guide', 'families', 'habitats'].includes(params.get('tab')) ? params.get('tab') : 'guide';
    route.plantId = resolveSavedIds([params.get('plant') ?? ''], catalog.plants)[0] ?? null;
    route.settings = params.get('settings') === '1';
    route.query = params.get('q') ?? '';
    route.familyFilter = families.has(params.get('family')) ? params.get('family') : null;
    route.habitat = habitats.has(params.get('habitat')) ? params.get('habitat') : '';
    if (units.has(params.get('uc'))) route.scope = { kind: 'unit', name: params.get('uc') };
    else if (families.has(params.get('scopeFamily'))) route.scope = { kind: 'family', name: params.get('scopeFamily') };
    route.browser.section = ['families', 'species', 'units'].includes(params.get('section')) ? params.get('section') : 'families';
    route.browser.family = families.has(params.get('bfamily')) ? params.get('bfamily') : null;
    route.browser.origin = route.browser.family && route.browser.section === 'species' ? 'families' : null;
    route.browser.queries = { families: params.get('fq') ?? '', species: params.get('sq') ?? '', units: params.get('uq') ?? '' };
    route.preferences = {
      photosOnly: params.get('photos') !== '0', alphabetical: params.get('sort') === 'name',
      principalName: params.get('names') === 'scientific' ? 'scientific' : 'common',
      advanced: params.get('mode') === 'list', mainPhoto: mainPhotoKinds.includes(params.get('photo')) ? params.get('photo') : 'default',
    };
    const columns = Number(params.get('cols'));
    route.columns = Number.isInteger(columns) && columns >= 6 && columns <= 22 ? columns : 10;
    return route;
  };
}

export function webRouteSearch(route) {
  const params = new URLSearchParams();
  if (route.plantId) params.set('plant', route.plantId);
  params.set('tab', route.tab);
  if (route.query) params.set('q', route.query);
  if (route.familyFilter) params.set('family', route.familyFilter);
  if (route.habitat) params.set('habitat', route.habitat);
  if (route.scope) params.set(route.scope.kind === 'unit' ? 'uc' : 'scopeFamily', route.scope.name);
  if (route.browser.section !== 'families') params.set('section', route.browser.section);
  if (route.browser.family) params.set('bfamily', route.browser.family);
  for (const [section, key] of [['families', 'fq'], ['species', 'sq'], ['units', 'uq']]) {
    if (route.browser.queries[section]) params.set(key, route.browser.queries[section]);
  }
  params.set('photos', route.preferences.photosOnly ? '1' : '0');
  params.set('sort', route.preferences.alphabetical ? 'name' : 'family');
  params.set('names', route.preferences.principalName);
  params.set('mode', route.preferences.advanced ? 'list' : 'grid');
  if (route.preferences.mainPhoto !== 'default') params.set('photo', route.preferences.mainPhoto);
  if (route.columns !== 10) params.set('cols', String(route.columns));
  if (route.settings) params.set('settings', '1');
  return `?${params}`;
}

// Search typing and display choices replace a history entry; page/filter changes push one.
export function webRoutePageKey(route) {
  return JSON.stringify([route.tab, route.plantId, route.settings, route.familyFilter, route.habitat, route.scope,
    route.tab === 'families' ? [route.browser.section, route.browser.family] : null]);
}

export function conservationUnitHref(name) {
  const route = defaultWebRoute();
  route.scope = { kind: 'unit', name };
  return `/${webRouteSearch(route)}`;
}
