import React, { useMemo } from "react";
import { FlatList, Image, Pressable, SectionList, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import type { ChecklistRow, Plant } from "../catalog.mjs";
import type { BrowserSection } from "../catalogBrowser.mjs";
import { matchesIndexName, plantsForRows, rowsForConservationUnit } from "../catalogBrowser.mjs";
import { plantThumbnails } from "../data/plant-thumbnails";
import { palette } from "../theme";
import type { CatalogBrowserProps } from "./CatalogBrowser";
import { ForwardIcon, LeafIcon, ListIcon } from "./icons";

const tabs: { id: BrowserSection; label: string; prompt: string }[] = [
  { id: "families", label: "Famílias", prompt: "Buscar família…" },
  { id: "units", label: "Unidades de Conservação", prompt: "Buscar unidade de conservação…" },
  { id: "habitats", label: "Fitofisionomias", prompt: "Buscar fitofisionomia…" },
];

export function DesktopCatalogBrowser({ state, dispatch, rows, allRows, families, units, habitats, onHabitat, onOpen, onGuide, onTabChange }: CatalogBrowserProps) {
  const { width } = useWindowDimensions();
  const columns = width >= 1500 ? 4 : 3;
  const familyColumns = width >= 1500 ? 5 : width >= 1100 ? 4 : 3;
  const cardWidth = (Math.min(width, 1488) - 64 - 18 * (columns - 1)) / columns;
  const familyCardWidth = (Math.min(width, 1488) - 64 - 18 * (familyColumns - 1)) / familyColumns;
  const query = state.queries[state.section];
  const tab = tabs.find(tab => tab.id === state.section) ?? { id: "species", label: "Espécies", prompt: "Buscar espécie…" };
  const familyPlants = useMemo(() => {
    const groups = new Map<string, Plant[]>();
    for (const plant of plantsForRows(allRows)) groups.set(plant.family, [...(groups.get(plant.family) ?? []), plant]);
    return groups;
  }, [allRows]);
  const visibleFamilies = useMemo(() => families.filter(item => matchesIndexName(item.name, state.queries.families)), [families, state.queries.families]);
  const visibleUnits = useMemo(() => units.filter(item => matchesIndexName(item.name, state.queries.units)), [units, state.queries.units]);
  const visibleHabitats = useMemo(() => habitats.filter(item => matchesIndexName(item.name, state.queries.habitats)), [habitats, state.queries.habitats]);
  const sequence = useMemo(() => plantsForRows(rows), [rows]);
  const sections = useMemo(() => {
    const groups = new Map<string, ChecklistRow[]>();
    for (const row of rows) groups.set(row.family, [...(groups.get(row.family) ?? []), row]);
    return [...groups].map(([title, members]) => ({ title, members, data: Array.from({ length: Math.ceil(members.length / columns) }, (_, i) => members.slice(i * columns, (i + 1) * columns)) }));
  }, [rows, columns]);
  const count = state.section === "families" ? visibleFamilies.length : state.section === "units" ? visibleUnits.length : state.section === "habitats" ? visibleHabitats.length : rows.length;
  return <View style={styles.screen} testID="desktop-catalog-browser">
    <View style={styles.heading}>
      <View style={styles.headingCopy}>
        <View style={styles.headingTitleRow}>
          <Text style={styles.title} numberOfLines={1}>{state.section === "species" && state.family ? state.family : "Explorar"}</Text>
          <Text style={styles.resultCount}>{count} {state.section === "families" ? "famílias" : state.section === "units" ? "unidades" : state.section === "habitats" ? "fitofisionomias" : count === 1 ? "espécie" : "espécies"}</Text>
        </View>
        {state.section === "species" && state.family && <Pressable accessibilityRole="button" accessibilityLabel="Voltar às famílias" onPress={() => dispatch({ type: "back" })} style={styles.back}>
          <Text style={styles.backLabel}>Todas as famílias</Text>
        </Pressable>}
      </View>
      <View style={styles.search}>
        <TextInput accessibilityLabel={tab.prompt} placeholder={tab.prompt} placeholderTextColor={palette.muted} value={query}
          onChangeText={query => dispatch({ type: "query", query })} style={styles.input} />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" style={styles.clear} onPress={() => dispatch({ type: "query", query: "" })}><Text style={styles.clearText}>×</Text></Pressable>}
      </View>
      <View accessibilityRole="tablist" accessibilityLabel="Explorar catálogo" style={styles.tabs}>
        {tabs.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: item.id === state.section }}
          onPress={() => onTabChange(item.id)} style={[styles.tab, item.id === state.section && styles.selectedTab]}>
          <Text style={[styles.tabText, item.id === state.section && styles.selectedText]}>{item.label}</Text>
        </Pressable>)}
      </View>
    </View>
    <View style={[styles.content, state.section !== "families" && styles.hidden]}>
      <FlatList key={`families-${familyColumns}`} data={visibleFamilies} numColumns={familyColumns} keyExtractor={item => item.name}
        initialNumToRender={familyColumns * 6} contentContainerStyle={styles.grid} columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma família encontrada.</Text>}
        renderItem={({ item }) => {
          const members = familyPlants.get(item.name) ?? [];
          const illustrated = members.filter(plant => plant.photos.some(photo => plantThumbnails[photo.fileName]));
          return <Pressable accessibilityRole="button" accessibilityLabel={`Ver espécies de ${item.name}`} testID={`desktop-family-${item.name}`}
            onPress={() => onGuide(plantsForRows(allRows.filter(row => row.family === item.name)), item.name)} style={[styles.familyCard, { maxWidth: familyCardWidth }]}>
            <View style={styles.previewStrip}>
              {illustrated.length ? illustrated.slice(0, 3).map(plant => <Image key={plant.id} source={plantThumbnails[plant.photos.find(photo => plantThumbnails[photo.fileName])!.fileName]} style={styles.previewImage} resizeMode="cover" />)
                : <View style={styles.previewEmpty}><ListIcon color={palette.pine} size={32} /></View>}
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}><Text style={styles.cardTitle}>{item.name}</Text><ForwardIcon color={palette.pine} size={21} /></View>
              <Text style={styles.cardCount}>{item.speciesCount} {item.speciesCount === 1 ? "espécie" : "espécies"}</Text>
              <Text style={styles.cardNote}>{illustrated.length ? `${illustrated.length} ${illustrated.length === 1 ? "ficha com fotos" : "fichas com fotos"}` : "Referências no catálogo"}</Text>
            </View>
          </Pressable>;
        }} />
    </View>
    <View style={[styles.content, state.section !== "units" && styles.hidden]}>
      <FlatList key={`units-${columns}`} data={visibleUnits} numColumns={columns} keyExtractor={item => item.name}
        initialNumToRender={columns * 6} contentContainerStyle={styles.grid} columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma unidade encontrada.</Text>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${item.name} no guia`} testID={`desktop-unit-${item.name}`}
          onPress={() => onGuide(plantsForRows(rowsForConservationUnit(allRows, item.name)), item.name)} style={[styles.unitCard, { maxWidth: cardWidth }]}>
          <View style={styles.unitIcon}><LeafIcon color={palette.pine} size={27} /></View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCount}>{item.speciesCount} {item.speciesCount === 1 ? "espécie registrada" : "espécies registradas"}</Text>
          <View style={styles.unitFooter}><Text style={styles.actionLabel}>Explorar no guia</Text><ForwardIcon color={palette.pine} size={21} /></View>
        </Pressable>} />
    </View>
    <View style={[styles.content, state.section !== "habitats" && styles.hidden]}>
      <FlatList key={`habitats-${columns}`} data={visibleHabitats} numColumns={columns} keyExtractor={item => item.name}
        contentContainerStyle={styles.grid} columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma fitofisionomia encontrada.</Text>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${item.name} no guia`}
          onPress={() => onHabitat(item.name)} style={[styles.unitCard, { maxWidth: cardWidth }]}>
          <View style={styles.unitIcon}><LeafIcon color={palette.pine} size={27} /></View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCount}>{item.speciesCount} {item.speciesCount === 1 ? "espécie registrada" : "espécies registradas"}</Text>
          <View style={styles.unitFooter}><Text style={styles.actionLabel}>Explorar no guia</Text><ForwardIcon color={palette.pine} size={21} /></View>
        </Pressable>} />
    </View>
    <View style={[styles.content, state.section !== "species" && styles.hidden]}>
      <SectionList key={`species-${columns}`} sections={sections} keyExtractor={item => item.map(row => row.scientificName).join('|')}
        initialNumToRender={10} stickySectionHeadersEnabled={false} contentContainerStyle={styles.speciesContent}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma espécie encontrada neste recorte.</Text>}
        renderSectionHeader={({ section }) => <View style={styles.familyHeading}>
          <Text style={styles.familyTitle}>{section.title} <Text style={styles.cardNote}>· {section.members.length} {section.members.length === 1 ? "espécie" : "espécies"}</Text></Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${section.title} no guia`} style={styles.familyAction} onPress={() => onGuide(plantsForRows(section.members), section.title)}>
            <Text style={styles.actionLabel}>Ver no guia</Text><ForwardIcon color={palette.pine} size={18} />
          </Pressable>
        </View>}
        renderItem={({ item }) => <View style={styles.speciesRow}>
          {item.map(row => <SpeciesCard key={row.scientificName} row={row} onOpen={() => onOpen(row.plant, sequence)} />)}
          {Array.from({ length: columns - item.length }, (_, i) => <View key={`empty-${i}`} style={styles.cardSpacer} />)}
        </View>} />
    </View>
  </View>;
}

function SpeciesCard({ row, onOpen }: { row: ChecklistRow; onOpen: () => void }) {
  const photo = row.plant.photos.find(photo => photo.taxonName === row.scientificName && plantThumbnails[photo.fileName]);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Consultar ${row.scientificName}`} testID={`desktop-species-${row.scientificName}`}
    onPress={onOpen} style={styles.speciesCard}>
    {photo ? <Image source={plantThumbnails[photo.fileName]} style={styles.speciesPhoto} resizeMode="cover" /> : <View style={styles.speciesPhotoFallback}><LeafIcon color={palette.pine} size={27} /></View>}
    <View style={styles.speciesNames}>
      <Text style={styles.speciesName}>{row.scientificName}</Text>
      {!!row.commonName && row.commonName !== row.scientificName && <Text style={styles.commonName}>{row.commonName}</Text>}
      <Text style={styles.cardNote}>{row.geography === "rio-city" ? "Município do Rio" : "Estado do RJ · município a confirmar"}</Text>
      <Text style={styles.recordKind}>{row.plant.rank === "genus" ? `No grupo ${row.plant.scientificName}` : row.plant.presentation === "checklist" ? "Referência · identificação em preparação" : "Ficha ilustrada"}</Text>
    </View>
    <ForwardIcon color={palette.pine} size={18} />
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.sand, paddingTop: 12 },
  heading: { width: "100%", maxWidth: 1488, alignSelf: "center", paddingHorizontal: 32, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 16 },
  headingCopy: { flex: 1, minWidth: 0, gap: 6 },
  headingTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  title: { color: palette.ink, fontSize: 27, fontWeight: "800" },
  tabs: { flexDirection: "row", borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 4, backgroundColor: palette.paper },
  tab: { minHeight: 40, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: "transparent", borderRadius: 7 },
  selectedTab: { borderColor: palette.pine },
  tabText: { fontSize: 13, color: palette.muted },
  selectedText: { color: palette.ink, fontWeight: "700" },
  search: { flex: 1.3, maxWidth: 640, minWidth: 180, flexDirection: "row", alignItems: "center", backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.border, borderRadius: 10 },
  input: { flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: 14, fontSize: 14, color: palette.ink },
  clear: { width: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: 22, color: palette.pine },
  resultCount: { color: palette.muted, fontSize: 12 },
  back: { minHeight: 24, justifyContent: "center" },
  backLabel: { color: palette.pine, fontSize: 13, textDecorationLine: "underline" },
  content: { flex: 1 }, hidden: { display: "none" },
  grid: { width: "100%", maxWidth: 1488, alignSelf: "center", paddingHorizontal: 32, paddingBottom: 28, gap: 18 },
  gridRow: { gap: 18 },
  familyCard: { flex: 1, maxWidth: "33.333%", borderRadius: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, overflow: "hidden" },
  previewStrip: { height: 104, flexDirection: "row", gap: 2, backgroundColor: palette.moss },
  previewImage: { flex: 1, height: "100%" },
  previewEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 16, gap: 6 },
  cardTitleRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  cardTitle: { flex: 1, color: palette.ink, fontSize: 17, lineHeight: 23, fontWeight: "700" },
  cardCount: { color: palette.pine, fontSize: 13, fontWeight: "600" },
  cardNote: { color: palette.muted, fontSize: 11, lineHeight: 16, fontWeight: "400" },
  unitCard: { flex: 1, maxWidth: "33.333%", minHeight: 224, backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 20, gap: 12 },
  unitIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: palette.moss, alignItems: "center", justifyContent: "center" },
  unitFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8 },
  actionLabel: { color: palette.pine, fontSize: 12, fontWeight: "600" },
  speciesContent: { width: "100%", maxWidth: 1488, alignSelf: "center", paddingHorizontal: 32, paddingBottom: 28 },
  familyHeading: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 12, paddingTop: 8 },
  familyTitle: { flex: 1, fontSize: 17, color: palette.ink, fontWeight: "700" },
  familyAction: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 8 },
  speciesRow: { flexDirection: "row", gap: 14, paddingBottom: 14 },
  speciesCard: { flex: 1, minWidth: 0, backgroundColor: palette.paper, padding: 14, borderWidth: 1, borderColor: palette.border, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  cardSpacer: { flex: 1 },
  speciesPhoto: { width: 64, height: 80, borderRadius: 6, backgroundColor: palette.moss },
  speciesPhotoFallback: { width: 64, height: 80, borderRadius: 6, backgroundColor: palette.moss, alignItems: "center", justifyContent: "center" },
  speciesNames: { flex: 1, minWidth: 0, gap: 4 },
  speciesName: { color: palette.ink, fontSize: 14, lineHeight: 20, fontStyle: "italic", fontWeight: "400" },
  commonName: { color: palette.ink, fontSize: 12, lineHeight: 17 },
  recordKind: { color: palette.pine, fontSize: 10, lineHeight: 15 },
  empty: { color: palette.muted, fontSize: 14, paddingVertical: 24 },
});
