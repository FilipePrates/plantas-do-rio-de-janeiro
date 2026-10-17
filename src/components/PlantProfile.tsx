import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { Plant, PlantPhoto } from "../catalog.mjs";
import { originLabels } from "../catalog.mjs";
import type { PrincipalName } from "../presentation.mjs";
import { formatPlantNameForWrap, getPlantName } from "../presentation.mjs";
import { plantImages } from "../data/plant-images";
import { palette } from "../theme";
import { LeafIcon } from "./icons";
import { PlantPhotoMarkers } from "./PlantPhotoMarkers";

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}
export function PlantProfile({
  plant,
  principalName,
}: {
  plant: Plant;
  principalName: PrincipalName;
}) {
  const { width } = useWindowDimensions();
  const [size, setSize] = useState(Math.min(width, 640));
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const gallery = useRef<FlatList<PlantPhoto>>(null);
  useEffect(() => {
    setActiveIndex(0);
    setShowSources(false);
    setShowMembers(false);
  }, [plant.id]);
  useEffect(() => {
    setActiveIndex(0);
  }, [size]);
  function showPhoto(index: number) {
    const next = Math.max(0, Math.min(plant.photos.length - 1, index));
    gallery.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  }
  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View
        style={styles.profile}
        onLayout={(event) => setSize(event.nativeEvent.layout.width)}
      >
        {plant.photos.length ? (
          <>
            <FlatList
              key={`${plant.id}:${size}`}
              ref={gallery}
              horizontal
              pagingEnabled
              data={plant.photos}
              extraData={size}
              keyExtractor={(photo) => photo.id}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              directionalLockEnabled
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              windowSize={3}
              getItemLayout={(_, index) => ({
                length: size,
                offset: size * index,
                index,
              })}
              onScroll={(event) =>
                setActiveIndex(
                  Math.max(
                    0,
                    Math.min(
                      plant.photos.length - 1,
                      Math.round(event.nativeEvent.contentOffset.x / size),
                    ),
                  ),
                )
              }
              scrollEventThrottle={32}
              renderItem={({ item }) => (
                <PhotoFrame photo={item} name={plant.commonName} size={size} />
              )}
            />
            {plant.photos.length > 1 && (
              <View style={styles.galleryNavigation}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Foto anterior"
                  accessibilityState={{ disabled: activeIndex === 0 }}
                  disabled={activeIndex === 0}
                  onPress={() => showPhoto(activeIndex - 1)}
                  style={styles.arrow}
                >
                  <Text
                    style={[
                      styles.arrowText,
                      activeIndex === 0 && styles.disabled,
                    ]}
                  >
                    ‹
                  </Text>
                </Pressable>
                <View style={styles.dots}>
                  {plant.photos.length <= 10 ? (
                    plant.photos.map((photo, index) => (
                      <Pressable
                        key={photo.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Foto ${index + 1}: ${photo.caption || "planta"}`}
                        accessibilityState={{ selected: activeIndex === index }}
                        onPress={() => showPhoto(index)}
                        style={styles.dotButton}
                      >
                        <View
                          style={[
                            styles.dot,
                            activeIndex === index && styles.activeDot,
                          ]}
                        />
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.small}>
                      {activeIndex + 1} / {plant.photos.length}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Foto seguinte"
                  accessibilityState={{
                    disabled: activeIndex === plant.photos.length - 1,
                  }}
                  disabled={activeIndex === plant.photos.length - 1}
                  onPress={() => showPhoto(activeIndex + 1)}
                  style={styles.arrow}
                >
                  <Text
                    style={[
                      styles.arrowText,
                      activeIndex === plant.photos.length - 1 &&
                        styles.disabled,
                    ]}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.emptyPhoto, { height: size }]}>
            <LeafIcon size={74} color={palette.pine} />
            <Text style={styles.muted}>Foto em preparação</Text>
          </View>
        )}
        <View style={styles.identity}>
          <Text
            style={[
              styles.primaryName,
              principalName === "scientific" && styles.scientific,
            ]}
          >
            {formatPlantNameForWrap(
              getPlantName(plant, principalName),
              principalName,
            )}
          </Text>
          <Text
            style={[
              styles.secondaryName,
              principalName === "common" && styles.scientific,
            ]}
          >
            {principalName === "common"
              ? `${plant.scientificName} ${plant.authorship}`.trim()
              : formatPlantNameForWrap(plant.commonName)}
          </Text>
          <View style={styles.identityMeta}>
            <Text style={styles.muted}>{plant.family}</Text>
            {plant.origin !== "native" && (
              <View style={styles.origin}>
                <Text style={styles.originText}>
                  {plant.origin === "invasive" ? "!  " : ""}
                  {originLabels[plant.origin]}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Section title="Descrição">
          <Text style={styles.body}>{plant.description}</Text>
        </Section>
        {!!plant.identification && (
          <Section title="Como reconhecer">
            <Text style={styles.body}>{plant.identification}</Text>
          </Section>
        )}
        {!!plant.ecology && (
          <Section title="Ambiente e ecologia">
            <Text style={styles.body}>{plant.ecology}</Text>
          </Section>
        )}
        <Section title="Outros nomes">
          <Text style={styles.body}>
            {plant.alternateNames.length
              ? plant.alternateNames.join(", ")
              : "Sem outros nomes cadastrados."}
          </Text>
        </Section>
        {plant.rank === "genus" && (
          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showMembers }}
              onPress={() => setShowMembers((v) => !v)}
            >
              <Text style={styles.sectionTitle}>
                {plant.regionalSpecies.length} espécies nativas registradas no
                estado {showMembers ? "−" : "+"}
              </Text>
            </Pressable>
            {showMembers && (
              <>
                <Text style={styles.muted}>
                  Recorte estadual da fonte consultada; não representa uma
                  contagem municipal.
                </Text>
                {plant.regionalSpecies.map((member) => (
                  <Text key={member.floraId} style={styles.member}>
                    {member.scientificName} · {member.substrates.join(", ")}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showSources }}
            onPress={() => setShowSources((v) => !v)}
          >
            <Text style={styles.sectionTitle}>
              Fontes e distribuição {showSources ? "−" : "+"}
            </Text>
          </Pressable>
          {showSources && (
            <>
              <Text style={styles.body}>
                {plant.geography === "rio-city"
                  ? "Município do Rio de Janeiro"
                  : "Estado do Rio de Janeiro"}
              </Text>
              <Text style={styles.muted}>
                Ambientes registrados no Brasil:{" "}
                {plant.habitats.join(" · ") || "em revisão"}
              </Text>
              <Text style={styles.muted}>
                {[...plant.lifeForms, ...plant.substrates].join(" · ")}
              </Text>
              {plant.sources.map((source) => (
                <Pressable
                  key={source.url}
                  accessibilityRole="link"
                  onPress={() => openUrl(source.url)}
                >
                  <Text style={styles.link}>{source.title} ↗</Text>
                  <Text style={styles.small}>
                    Consulta: {source.retrievedAt.slice(0, 10)}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
          {plant.reviewStatus === "draft" && (
            <Text style={styles.review}>Conteúdo em revisão</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
function PhotoFrame({
  photo,
  name,
  size,
}: {
  photo: PlantPhoto;
  name: string;
  size: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.photo, { width: size, height: size }]}>
      {!failed && plantImages[photo.fileName] ? (
        <Image
          source={plantImages[photo.fileName]}
          accessibilityLabel={`${name}: ${photo.caption || "foto iNaturalist"}`}
          style={styles.photoImage}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.photoFallback}>
          <LeafIcon size={64} color={palette.pine} />
          <Text style={styles.muted}>Foto em preparação</Text>
        </View>
      )}
      <PlantPhotoMarkers markers={photo.markers} />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Foto de ${photo.creator}, CC0. Abrir observação ${photo.observationId}`}
        onPress={() => openUrl(photo.observationUrl)}
        style={styles.credit}
      >
        <Text style={styles.creditText} numberOfLines={2}>
          {photo.creator} · CC0 ↗
        </Text>
      </Pressable>
    </View>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  content: { paddingBottom: 20 },
  profile: { width: "100%", maxWidth: 640, alignSelf: "center" },
  photo: { backgroundColor: palette.moss, position: "relative" },
  photoImage: { width: "100%", height: "100%" },
  photoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyPhoto: {
    backgroundColor: palette.moss,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  credit: {
    position: "absolute",
    bottom: 8,
    right: 8,
    maxWidth: "43%",
    backgroundColor: "rgba(36,49,39,0.72)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  creditText: { color: palette.paper, fontSize: 9, lineHeight: 12 },
  galleryNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    minHeight: 36,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  dotButton: {
    width: 23,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.border,
  },
  activeDot: { backgroundColor: palette.pine },
  arrow: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: palette.pine, fontSize: 27, lineHeight: 30 },
  disabled: { opacity: 0.2 },
  identity: { padding: 16, gap: 5 },
  primaryName: { color: palette.ink, fontSize: 23, fontWeight: "800" },
  secondaryName: { color: palette.muted, fontSize: 16 },
  scientific: { fontStyle: "italic" },
  identityMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 3,
  },
  origin: {
    backgroundColor: "#FBE3EC",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  originText: { color: "#9E3A62", fontSize: 11, fontWeight: "600" },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: 8,
  },
  sectionTitle: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  body: { color: palette.ink, fontSize: 15, lineHeight: 23 },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  small: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  member: {
    color: palette.muted,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 19,
  },
  link: {
    color: palette.pine,
    fontSize: 12,
    lineHeight: 19,
    textDecorationLine: "underline",
  },
  review: { color: palette.muted, fontSize: 11, marginTop: 6 },
});
