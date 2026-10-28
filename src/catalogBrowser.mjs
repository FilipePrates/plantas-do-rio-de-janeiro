import { conservationUnitNames, matchesChecklistRow, normalize } from './catalog.mjs';

export const initialBrowserState = {
  section: 'families', family: null, origin: null,
  queries: { families: '', species: '', units: '' },
};

export function browserReducer(state, action) {
  switch (action.type) {
    case 'tab': return {
      ...state, section: action.section, origin: null,
      // The Espécies tab is the complete index; selections belong to an index-to-list visit.
      ...(action.section === 'species' ? { family: null } : {}),
    };
    case 'query': return { ...state, queries: { ...state.queries, [state.section]: action.query } };
    case 'select': return {
      ...state, section: 'species', origin: 'families', family: action.family,
      queries: { ...state.queries, species: '' },
    };
    case 'back': return { ...state, section: state.origin ?? 'families', origin: null };
    default: return state;
  }
}

export function filterBrowserRows(rows, state) {
  return rows.filter((row) => (!state.family || row.family === state.family) &&
    matchesChecklistRow(row, state.queries.species));
}

export function rowsForConservationUnit(rows, name) {
  return rows.filter((row) => conservationUnitNames(row.plant, row.scientificName).includes(name));
}

export function conservationUnitIndex(rows) {
  const units = new Map();
  for (const row of rows) for (const name of conservationUnitNames(row.plant, row.scientificName)) {
    if (!units.has(name)) units.set(name, new Set());
    units.get(name).add(row.scientificName);
  }
  return [...units].map(([name, species]) => ({ name, speciesCount: species.size }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function matchesIndexName(name, query) {
  const haystack = normalize(name);
  return normalize(query).split(/\s+/).every((term) => haystack.includes(term));
}

export function plantsForRows(rows) {
  return [...new Map(rows.map((row) => [row.plant.id, row.plant])).values()];
}
