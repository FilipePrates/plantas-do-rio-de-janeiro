import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Plant, RegionalEvidence } from "../catalog.mjs";
import { conservationLabels } from "../catalog.mjs";
import { palette } from "../theme";

const scopeLabels = {
  brazil: "Brasil",
  "rio-state": "Estado do RJ",
  global: "Global",
  unspecified: "Abrangência não informada",
};

export function RegionalRecords({ plant }: { plant: Plant }) {
  const [expanded, setExpanded] = useState(false);
  const records = plant.regionalEvidence ?? [];
  if (!records.length) return null;
  const speciesCount = new Set(records.map((r) => r.scientificName)).size;
  const sources = [...new Map(records.map((r) => [r.source.url, r])).values()];
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Registros em unidades de conservação</Text>
      {records.some((r) => r.conservationAssessments.length) && (
        <Text style={styles.context}>Categoria histórica; a avaliação atual pode ser diferente.</Text>
      )}
      {plant.rank === "genus" && (
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.link}>{speciesCount} de {plant.regionalSpecies.length} espécies do grupo · {expanded ? "Recolher −" : "Ver registros +"}</Text>
        </Pressable>
      )}
      {(plant.rank === "species" || expanded) && records.map((record) => (
        <SpeciesRecords key={`${record.scientificName}:${record.source.url}`} record={record} showName={plant.rank === "genus"} />
      ))}
      {(plant.rank === "species" || expanded) && (
        <>
          {sources.map((record) => (
            <Pressable key={record.source.url} accessibilityRole="link" onPress={() => { void Linking.openURL(record.source.url).catch(() => undefined); }}>
              <Text style={styles.muted}>{record.source.title} ↗</Text>
            </Pressable>
          ))}
          <Text style={styles.context}>As listas não indicam todas as áreas onde as espécies podem ocorrer.</Text>
        </>
      )}
    </View>
  );
}

function SpeciesRecords({ record, showName }: { record: RegionalEvidence; showName: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const units = [...record.conservationUnits].sort((a, b) =>
    Number(Boolean(b.municipality)) - Number(Boolean(a.municipality)) || a.name.localeCompare(b.name, "pt-BR"));
  const shown = expanded ? units : units.slice(0, 4);
  const openPage = (page?: number) => {
    const url = page ? `${record.source.url.split("#")[0]}#page=${page}` : record.source.url;
    void Linking.openURL(url).catch(() => undefined);
  };
  return (
    <View style={styles.record}>
      {showName && <Text style={styles.species}>{record.scientificName}</Text>}
      {record.conservationAssessments.map((assessment) => (
        <View key={`${assessment.scope}:${assessment.referenceYear}:${assessment.category}`} style={styles.assessment}>
          <Text style={styles.body}>{conservationLabels[assessment.category]} ({assessment.category}) · {scopeLabels[assessment.scope]} · {assessment.referenceYear}</Text>
          <Text style={styles.muted}>{assessment.referenceTitle}.</Text>
        </View>
      ))}
      {record.endemicToRioState && <Text style={styles.muted}>Endêmica do estado do Rio de Janeiro na publicação de {record.publicationYear}.</Text>}
      {shown.map((unit) => (
        <Pressable key={unit.name} accessibilityRole="link" accessibilityLabel={`${unit.name}. Abrir fonte, página ${unit.sourcePage} do PDF.`} onPress={() => openPage(unit.sourcePage)} style={styles.unit}>
          <Text style={styles.link}>{unit.name} ↗</Text>
          {unit.municipality && <Text style={styles.muted}>UC no município do {unit.municipality}</Text>}
          {expanded && <Text style={styles.muted}>{unit.voucher}</Text>}
        </Pressable>
      ))}
      {!!units.length && (
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.more}>
          <Text style={styles.link}>{expanded ? "Recolher registros −" : units.length > 4 ? `Ver todas as ${units.length} unidades e referências +` : "Ver referências dos registros +"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 16, borderTopWidth: 1, borderTopColor: palette.border },
  title: { color: palette.ink, fontSize: 15, fontWeight: "700", marginBottom: 8 },
  record: { gap: 9, marginTop: 6, marginBottom: 12 },
  species: { color: palette.ink, fontSize: 17, fontStyle: "italic", marginTop: 8 },
  body: { color: palette.ink, fontSize: 15, lineHeight: 23 },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  context: { color: palette.muted, fontSize: 13, lineHeight: 19, marginVertical: 8 },
  link: { color: palette.pine, fontSize: 15, lineHeight: 22 },
  unit: { paddingVertical: 5, minHeight: 44, justifyContent: "center" },
  assessment: { padding: 12, backgroundColor: palette.sand, gap: 4 },
  more: { minHeight: 44, justifyContent: "center" },
});
