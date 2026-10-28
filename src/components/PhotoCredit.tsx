import React, { useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PlantPhoto } from "../catalog.mjs";
import { photoLicenseLabel, photoLicenseUrl } from "../catalog.mjs";
import { palette } from "../theme";

const open = (url: string) => void Linking.openURL(url).catch(() => undefined);

/** Full attribution stays readable offline; links expose the source and license. */
export function PhotoCredit({ photo }: { photo: PlantPhoto }) {
  const [visible, setVisible] = useState(false);
  const license = photoLicenseLabel(photo);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Créditos da foto de ${photo.creator}, ${license}`}
        onPress={() => setVisible(true)} style={styles.trigger}>
        <Text style={styles.triggerText} numberOfLines={2}>{photo.creator} · {license} ⓘ</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.title}>Créditos da fotografia</Text>
              <Text selectable style={styles.body}>{photo.attribution || photo.creator}</Text>
              <Pressable accessibilityRole="link" onPress={() => open(photoLicenseUrl(photo))}>
                <Text style={styles.link}>{license} — ler licença ↗</Text>
              </Pressable>
              <Pressable accessibilityRole="link" onPress={() => open(photo.photoPageUrl || `https://www.inaturalist.org/photos/${photo.photoId}`)}>
                <Text style={styles.link}>Foto #{photo.photoId} no iNaturalist ↗</Text>
              </Pressable>
              <Pressable accessibilityRole="link" onPress={() => open(photo.observationUrl)}>
                <Text style={styles.link}>Observação #{photo.observationId} ↗</Text>
              </Pressable>
              <Text style={styles.body}>Arquivo baixado do iNaturalist preservado. Miniaturas redimensionadas e recortadas em quadrado; a foto ampliada mantém o enquadramento do arquivo.</Text>
              {photo.licenseCode === "cc-by" && <Text style={styles.body}>A fotografia permanece disponível sob CC BY 4.0. O crédito não implica apoio do autor ao guia.</Text>}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={styles.close}>
              <Text style={styles.link}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { minHeight: 44, justifyContent: "center" },
  triggerText: { color: palette.paper, fontSize: 11, lineHeight: 15 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  panel: { backgroundColor: palette.paper, maxWidth: 540, width: "100%", maxHeight: "85%" },
  content: { padding: 24, gap: 16 },
  title: { color: palette.pine, fontSize: 20, fontWeight: "700" },
  body: { color: palette.ink, fontSize: 15, lineHeight: 22 },
  link: { color: palette.pine, fontSize: 15, lineHeight: 22, textDecorationLine: "underline", paddingVertical: 4 },
  close: { paddingHorizontal: 24, paddingVertical: 12, alignItems: "flex-end" },
});
