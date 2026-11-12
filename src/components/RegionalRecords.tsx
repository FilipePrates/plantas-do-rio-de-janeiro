import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Plant, RegionalEvidence } from "../catalog.mjs";
import { conservationLabels } from "../catalog.mjs";
import { palette } from "../theme";
import { ConservationUnitLink } from './ConservationUnitLink';

const scopeLabels = {
  brazil: "Brasil",
  "rio-state": "Estado do RJ",
  global: "Global",
  unspecified: "Abrangência não informada",
};

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

export function RegionalRecords({ plant, onOpenUnit, unitHref }: { plant: Plant; onOpenUnit?: (name: string) => void; unitHref?: (name: string) => string }) {
  const records = (plant.regionalEvidence ?? []).filter((record) => record.conservationUnits.length);
  if (!records.length) return null;
  const sources = [...new Map(records.map((record) => [record.source.url, record.source])).values()];
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Unidades de Conservação</Text>
      {records.map((record) => (
        <SpeciesRecords key={`${record.scientificName}:${record.source.url}`} record={record} showName={plant.rank === "genus"} onOpenUnit={onOpenUnit} unitHref={unitHref} />
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

function SpeciesRecords({ record, showName, onOpenUnit, unitHref }: { record: RegionalEvidence; showName: boolean; onOpenUnit?: (name: string) => void; unitHref?: (name: string) => string }) {
  const units = [...record.conservationUnits].sort((a, b) =>
    Number(Boolean(b.municipality)) - Number(Boolean(a.municipality)) || a.name.localeCompare(b.name, "pt-BR"));
  return (
    <View style={styles.record}>
      {showName && <Text style={styles.species}>{record.scientificName}</Text>}
      {units.map((unit) => (
        <Text key={unit.name} style={styles.unit}>
          {onOpenUnit ? <ConservationUnitLink name={unit.name} onOpen={onOpenUnit} href={unitHref?.(unit.name)} /> : unit.name}{unit.municipality ? ` · ${unit.municipality}` : ""}
        </Text>
      ))}
    </View>
  );
}

export function ConservationStatus({ plant }: { plant: Plant }) {
  if (plant.rank === "genus") return null;
  const records = (plant.regionalEvidence ?? []).filter((record) =>
    record.conservationAssessments.length || record.endemicToRioState);
  if (!records.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Estado de conservação</Text>
      {records.map((record) => (
        <View key={`${record.scientificName}:${record.source.url}`} style={styles.record}>
          {record.conservationAssessments.map((assessment) => (
            <View key={`${assessment.scope}:${assessment.referenceYear}:${assessment.category}`} style={styles.assessment}>
              <Text style={styles.body}>{conservationLabels[assessment.category]} ({assessment.category}) · {scopeLabels[assessment.scope]} · {assessment.referenceYear}</Text>
              <Text style={styles.muted}>{assessment.referenceTitle}.</Text>
            </View>
          ))}
          {record.endemicToRioState && <Text style={styles.muted}>Endêmica do estado do Rio de Janeiro na publicação de {record.publicationYear}.</Text>}
          <Pressable accessibilityRole="link" onPress={() => openUrl(record.source.url)}>
            <Text style={styles.reference}>Referência: {record.source.title} ↗</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 16, borderTopWidth: 1, borderTopColor: palette.border, gap: 8 },
  title: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  record: { gap: 5, marginBottom: 4 },
  species: { color: palette.ink, fontSize: 15, fontStyle: "italic", fontWeight: "400", marginTop: 6 },
  body: { color: palette.ink, fontSize: 15, lineHeight: 22 },
  unit: { color: palette.ink, fontSize: 14, lineHeight: 20 },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  context: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  reference: { color: palette.pine, fontSize: 12, lineHeight: 18 },
  assessment: { padding: 10, backgroundColor: palette.sand, gap: 4, marginBottom: 4 },
});
