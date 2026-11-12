import React, { useMemo } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import type { ChecklistRow, Plant } from "../catalog.mjs";
import type { BrowserAction, BrowserSection, BrowserState, CatalogIndexEntry } from "../catalogBrowser.mjs";
import { matchesIndexName, plantsForRows, rowsForConservationUnit } from "../catalogBrowser.mjs";
import { palette } from "../theme";
import { SpeciesChecklist } from "./SpeciesChecklist";
import { ForwardIcon } from "./icons";
import { DesktopCatalogBrowser } from "./DesktopCatalogBrowser";

const tabs: { id: BrowserSection; label: string }[] = [
  { id: "families", label: "Famílias" },
  { id: "units", label: "Unidades de Conservação" },
  { id: "habitats", label: "Fitofisionomias" },
];
const prompts = { families: "Buscar família…", species: "Buscar espécie, família ou unidade…", units: "Buscar unidade de conservação…", habitats: "Buscar fitofisionomia…" };

export interface CatalogBrowserProps {
  state: BrowserState;
  dispatch: (action: BrowserAction) => void;
  rows: ChecklistRow[];
  allRows: ChecklistRow[];
  families: CatalogIndexEntry[];
  units: CatalogIndexEntry[];
  habitats: CatalogIndexEntry[];
  onHabitat: (name: string) => void;
  onOpen: (plant: Plant, sequence: Plant[]) => void;
  onGuide: (plants: Plant[], label: string) => void;
  onTabChange: (section: BrowserSection) => void;
}

export function CatalogBrowser(props: CatalogBrowserProps) {
  const { state, dispatch, rows, allRows, families, units, habitats, onHabitat, onOpen, onGuide, onTabChange } = props;
  const { width } = useWindowDimensions();
  const plants = useMemo(() => plantsForRows(rows), [rows]);
  const query = state.queries[state.section];
  if (Platform.OS === "web" && width >= 1024) return <DesktopCatalogBrowser {...props} />;
  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {tabs.map(({ id, label }) => (
          <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: state.section === id }}
            onPress={() => onTabChange(id)}
            style={[styles.tab, id === "units" && styles.wideTab, state.section === id && styles.selectedTab]}>
            <Text style={[styles.tabText, state.section === id && styles.selectedText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.controls}>
        <View style={styles.search}>
          <TextInput accessibilityLabel={prompts[state.section]} placeholder={prompts[state.section]}
            placeholderTextColor={palette.muted} value={query}
            onChangeText={(value) => dispatch({ type: "query", query: value })} style={styles.input} />
          {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca"
            onPress={() => dispatch({ type: "query", query: "" })} style={styles.clear}>
            <Text style={styles.clearText}>×</Text>
          </Pressable>}
        </View>
      </View>
      {/* Keep each index mounted so Back and tab changes retain scroll position. */}
      <View style={[styles.list, state.section !== "families" && styles.hidden]}>
        <IndexList entries={families} query={state.queries.families} empty="Nenhuma família encontrada."
          onSelect={(name) => onGuide(plantsForRows(allRows.filter(row => row.family === name)), name)} guide />
      </View>
      <View style={[styles.list, state.section !== "units" && styles.hidden]}>
        <IndexList entries={units} query={state.queries.units} empty="Nenhuma unidade encontrada."
          onSelect={(name) => onGuide(plantsForRows(rowsForConservationUnit(allRows, name)), name)} recorded guide />
      </View>
      <View style={[styles.list, state.section !== "habitats" && styles.hidden]}>
        <IndexList entries={habitats} query={state.queries.habitats} empty="Nenhuma fitofisionomia encontrada."
          onSelect={onHabitat} recorded guide />
      </View>
      <View style={[styles.list, state.section !== "species" && styles.hidden]}>
        <SpeciesChecklist key={`${state.family}:${state.queries.species}`} rows={rows}
          onOpen={(plant) => onOpen(plant, plants)}
          onOpenFamily={(family, selection) => onGuide(selection, family)} />
      </View>
    </View>
  );
}

function IndexList({ entries, query, onSelect, empty, recorded = false, guide = false }: {
  entries: CatalogIndexEntry[]; query: string; onSelect: (name: string) => void; empty: string; recorded?: boolean; guide?: boolean;
}) {
  const visible = useMemo(() => entries.filter((entry) => matchesIndexName(entry.name, query)), [entries, query]);
  return <FlatList data={visible} keyExtractor={(item) => item.name} initialNumToRender={18}
    keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.indexContent}
    ListHeaderComponent={recorded ? <Text style={styles.note}>Espécies com registros no catálogo.</Text> : null}
    renderItem={({ item }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={guide ? `Ver ${item.name} no guia` : `Ver espécies de ${item.name}`}
        onPress={() => onSelect(item.name)} style={styles.indexRow}>
        <View style={styles.indexNames}>
          <Text style={styles.indexName}>{item.name}</Text>
          <Text style={styles.count}>{item.speciesCount} {item.speciesCount === 1 ? "espécie" : "espécies"}</Text>
        </View>
        <ForwardIcon color={palette.pine} size={25} />
      </Pressable>
    )}
    ListEmptyComponent={<Text style={styles.note}>{empty}</Text>} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  tabs: { flexDirection: "row", backgroundColor: palette.sand, borderBottomWidth: 1, borderBottomColor: palette.border },
  tab: { flex: 1, minHeight: 58, paddingHorizontal: 6, paddingVertical: 10, justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  wideTab: { flex: 1.7 },
  selectedTab: { borderBottomColor: palette.pine, backgroundColor: palette.moss },
  tabText: { textAlign: "center", color: palette.muted, fontSize: 13, lineHeight: 18 },
  selectedText: { color: palette.pine, fontWeight: "700" },
  controls: { padding: 12 },
  search: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: palette.border, borderRadius: 10 },
  input: { flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: 12, color: palette.ink, fontSize: 14 },
  clear: { width: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearText: { color: palette.pine, fontSize: 22 },
  list: { flex: 1 },
  hidden: { display: "none" },
  indexContent: { paddingHorizontal: 12, paddingBottom: 20 },
  indexRow: { minHeight: 68, paddingVertical: 14, paddingHorizontal: 4, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: palette.border },
  indexNames: { flex: 1, gap: 5 },
  indexName: { color: palette.ink, fontSize: 16, lineHeight: 22, fontWeight: "600" },
  count: { color: palette.muted, fontSize: 12 },
  note: { paddingVertical: 16, color: palette.muted, fontSize: 13, lineHeight: 19 },
});
