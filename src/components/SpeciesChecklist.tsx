import React, { useMemo } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import type { Catalog, ChecklistRow, Plant } from "../catalog.mjs";
import { checklistRows, matchesChecklistRow } from "../catalog.mjs";
import { palette } from "../theme";

export function SpeciesChecklist({ catalog, query, family, cityOnly, onOpen }: {
  catalog: Catalog;
  query: string;
  family: string | null;
  cityOnly: boolean;
  onOpen: (plant: Plant) => void;
}) {
  const rows = useMemo(() => checklistRows(catalog).filter((row) =>
    matchesChecklistRow(row, query) && (!family || row.family === family) &&
    (!cityOnly || row.geography === "rio-city")), [catalog, query, family, cityOnly]);
  const sections = useMemo(() => {
    const families = new Map<string, ChecklistRow[]>();
    for (const row of rows) {
      const group = families.get(row.family) || [];
      group.push(row);
      families.set(row.family, group);
    }
    return [...families].map(([title, data]) => ({ title, data }));
  }, [rows]);
  return (
    <SectionList
      sections={sections}
      keyExtractor={(row) => row.scientificName}
      stickySectionHeadersEnabled={false}
      initialNumToRender={15}
      ListHeaderComponent={
        <Text style={styles.introduction}>
          {rows.length} {rows.length === 1 ? "espécie" : "espécies"} · consulta offline. Cada espécie aparece uma vez.
          Registros publicados podem ser históricos; as fontes não garantem presença atual.
        </Text>
      }
      renderSectionHeader={({ section }) => <Text style={styles.family}>{section.title}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onOpen(item.plant)}
          accessibilityRole="button" accessibilityLabel={`Consultar ${item.scientificName}`}>
          <View style={styles.names}>
            <Text style={styles.name}>{item.scientificName}</Text>
            {!!item.commonName && item.commonName !== item.scientificName && <Text style={styles.secondary}>{item.commonName}</Text>}
            <Text style={styles.secondary}>
              {item.geography === "rio-city" ? "Registro municipal" : "Registro estadual · município a confirmar"}
            </Text>
            <Text style={styles.kind}>
              {item.plant.rank === "genus" ? `No grupo ${item.plant.scientificName}` :
                item.plant.presentation === "checklist" ? "Referência · identificação em preparação" : "Ficha ilustrada"}
              {item.plant.reviewStatus === "draft" ? " · em revisão" : ""}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      )}
      ListEmptyComponent={<Text style={styles.introduction}>Nenhuma espécie encontrada neste recorte.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  introduction: { color: palette.muted, fontSize: 13, lineHeight: 19, padding: 16 },
  family: { backgroundColor: palette.moss, color: palette.ink, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 9 },
  row: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border, flexDirection: "row", alignItems: "center", gap: 10 },
  names: { flex: 1, gap: 4 },
  name: { color: palette.ink, fontSize: 16, fontStyle: "italic" },
  secondary: { color: palette.muted, fontSize: 13 },
  kind: { color: palette.pine, fontSize: 12 },
  arrow: { color: palette.pine, fontSize: 25 },
});
