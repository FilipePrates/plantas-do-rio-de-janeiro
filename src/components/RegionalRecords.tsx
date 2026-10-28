import React from "react";
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

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

export function RegionalRecords({ plant }: { plant: Plant }) {
  const records = plant.regionalEvidence ?? [];
  if (!records.length) return null;
  const sources = [...new Map(records.map((record) => [record.source.url, record.source])).values()];
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Unidades de Conservação</Text>
      {records.map((record) => (
        <SpeciesRecords key={`${record.scientificName}:${record.source.url}`} record={record} showName={plant.rank === "genus"} />
      ))}
      <Text style={styles.context}>Esses registros são datados; as listas não cobrem todas as áreas de ocorrência.</Text>
      {sources.map((source) => (
        <Pressable key={source.url} accessibilityRole="link" onPress={() => openUrl(source.url)}>
          <Text style={styles.reference}>Referência: {source.title} ↗</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SpeciesRecords({ record, showName }: { record: RegionalEvidence; showName: boolean }) {
  const units = [...record.conservationUnits].sort((a, b) =>
    Number(Boolean(b.municipality)) - Number(Boolean(a.municipality)) || a.name.localeCompare(b.name, "pt-BR"));
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
      {units.map((unit) => (
        <Text key={unit.name} style={styles.unit}>
          {unit.name}{unit.municipality ? ` · ${unit.municipality}` : ""}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 16, borderTopWidth: 1, borderTopColor: palette.border, gap: 8 },
  title: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  record: { gap: 5, marginBottom: 4 },
  species: { color: palette.ink, fontSize: 15, fontStyle: "italic", fontWeight: "600", marginTop: 6 },
  body: { color: palette.ink, fontSize: 15, lineHeight: 22 },
  unit: { color: palette.ink, fontSize: 14, lineHeight: 20 },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  context: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  reference: { color: palette.pine, fontSize: 12, lineHeight: 18 },
  assessment: { padding: 10, backgroundColor: palette.sand, gap: 4, marginBottom: 4 },
});
