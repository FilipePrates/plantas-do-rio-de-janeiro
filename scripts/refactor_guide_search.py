"""One-time extraction of unchanged result rendering so input updates stay light."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'App.tsx'
text=path.read_text(encoding='utf8')
assert 'const GuideResults = memo(' not in text, 'Already extracted.'
text=text.replace('import React, { useEffect, useMemo, useReducer, useRef, useState }',
                  'import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useReducer, useRef, useState }',1)
text=text.replace('  BackHandler,','  ActivityIndicator,\n  BackHandler,',1)
text=text.replace('  matchesPlant,\n','',1)
text=text.replace('import { defaultState, loadState, saveState } from "./src/storage";',
                  'import { defaultState, loadState, saveState } from "./src/storage";\nimport type { SavedState } from "./src/storage";\nimport { createPlantSearch } from "./src/plantSearch.mjs";',1)
text=text.replace('const catalog = parseCatalog(catalogJson);','const catalog = parseCatalog(catalogJson);\nconst prepareGuideSearch = createPlantSearch(catalog.plants);',1)
text=text.replace('  const [query, setQuery] = useState("");','  const [query, setQuery] = useState("");\n  const resultQuery = useDeferredValue(query);\n  const searchPending = query !== resultQuery;',1)
text=text.replace('  const visible = useMemo(\n    () =>\n      (saved.alphabetical',
                  '  const visible = useMemo(\n    () => {\n      const matchesQuery = prepareGuideSearch(resultQuery);\n      return (saved.alphabetical',1)
text=text.replace('          matchesPlant(plant, query) &&','          matchesQuery(plant) &&',1)
text=text.replace('      ),\n    [\n      saved.alphabetical,','      );\n    },\n    [\n      saved.alphabetical,',1)
text=text.replace('      query,\n      habitat,','      resultQuery,\n      habitat,',1)
text=text.replace('  function openPlant(plant: Plant, sequence = visible) {','  const openPlant = useCallback((plant: Plant, sequence = visible) => {',1)
text=text.replace('    setDetailId(plant.id);\n  }\n  function rememberGuide()',
                  '    setDetailId(plant.id);\n  }, [visible]);\n  function rememberGuide()',1)
start=text.index('          {saved.advanced ? (')
end=text.index('\n        </View>\n      )}\n      {hydrated && (',start)
block=text[start:end].strip()
assert block.endswith(')}')
replacement='''          <View style={styles.flex} accessibilityState={{ busy: searchPending }}>
            <GuideResults visible={visible} sections={sections} saved={saved} gridCardSize={gridCardSize} openPlant={openPlant} />
          </View>'''
text=text[:start]+replacement+text[end:]
component='''const GuideResults = memo(function GuideResults({ visible, sections, saved, gridCardSize, openPlant }: {
  visible: Plant[];
  sections: { title: string; data: Plant[] }[];
  saved: SavedState;
  gridCardSize: number;
  openPlant: (plant: Plant) => void;
}) {
  return (
'''+block[1:-1]+'''
  );
});

'''
text=text.replace('function LoadingBrand() {',component+'function LoadingBrand() {',1)
spinner='''              {searchPending && (
                <View style={styles.searchProgress} accessibilityRole="progressbar" accessibilityLabel="Atualizando resultados" testID="guide-search-loading">
                  <ActivityIndicator size="small" color={palette.muted} />
                </View>
              )}
'''
text=text.replace('              {!!query && (',spinner+'              {!!query && (',1)
text=text.replace('  searchInputShell: {','  searchProgress: { width: 22, alignItems: "center", justifyContent: "center" },\n  searchInputShell: {',1)
path.write_text(text,encoding='utf8')
print('Guide input now defers indexed result updates; unchanged lists are memoized.')
