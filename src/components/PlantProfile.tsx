import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { Plant, PlantPhoto } from "../catalog.mjs";
import { conservationCodesForSpecies, originLabels } from "../catalog.mjs";
import type { MainPhoto, PrincipalName } from "../presentation.mjs";
import { formatPlantNameForWrap, getPlantName, getMainPhoto } from "../presentation.mjs";
import { plantImages } from "../data/plant-images";
import { palette } from "../theme";
import { BackIcon, BrandLeafIcon, ForwardIcon } from "./icons";
import { PlantPhotoMarkers } from "./PlantPhotoMarkers";
import { ConservationStatus, RegionalRecords } from "./RegionalRecords";
import { PhotoViewer } from "./PhotoViewer";
import { PhotoCredit } from "./PhotoCredit";
import { PhotoDragArea } from "./PhotoDragArea";

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}
export function PlantProfile({
  plant,
  principalName,
  relatedPlants = [],
  mainPhoto = "default",
  onPrevious,
  onNext,
  onOpenPlant,
  onOpenUnit,
  unitHref,
}: {
  plant: Plant;
  principalName: PrincipalName;
  mainPhoto?: MainPhoto;
  onPrevious?: () => void;
  onNext?: () => void;
  relatedPlants?: Plant[];
  onOpenPlant?: (plant: Plant) => void;
  onOpenUnit?: (name: string) => void;
  unitHref?: (name: string) => string;
}) {
  const { width, height } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 1024;
  const galleryWidth = Math.min(700, (Math.min(width, 1440) - 72) * 0.5, Math.max(260, height - 212));
  const [size, setSize] = useState(Math.min(width, 640));
  const firstPhotoIndex = Math.max(0, plant.photos.indexOf(getMainPhoto(plant, mainPhoto)!));
  const [activeIndex, setActiveIndex] = useState(firstPhotoIndex);
  const translateX = useRef(new Animated.Value(0)).current;
  const transitioning = useRef(false);
  const resetSwipe = () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 2 && (dx < 0 ? !!onNext : !!onPrevious),
    onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
      !transitioning.current && Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 2 && (dx < 0 ? !!onNext : !!onPrevious),
    onPanResponderMove: (_, { dx }) => { if (!transitioning.current) translateX.setValue(dx); },
    onPanResponderTerminate: resetSwipe,
    onPanResponderRelease: (_, { dx, dy }) => {
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
        const action = dx < 0 ? onNext : onPrevious;
        if (!action || transitioning.current) { resetSwipe(); return; }
        transitioning.current = true;
        Animated.timing(translateX, { toValue: dx < 0 ? -width : width, duration: 160, useNativeDriver: true }).start(({ finished }) => {
          transitioning.current = false;
          translateX.setValue(0);
          if (finished) action();
        });
      } else resetSwipe();
    },
  });
  const [showSources, setShowSources] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const gallery = useRef<FlatList<PlantPhoto>>(null);
  const activePhoto = plant.photos[activeIndex] ?? plant.photos[0];
  useEffect(() => {
    if (!desktop || viewerIndex !== null) return;
    function navigate(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;
      const action = event.key === "ArrowLeft" ? onPrevious : event.key === "ArrowRight" ? onNext : undefined;
      if (action) { event.preventDefault(); action(); }
    }
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [desktop, viewerIndex, onPrevious, onNext]);
  useEffect(() => {
    setActiveIndex(firstPhotoIndex);
    setShowSources(false);
    setViewerIndex(null);
  }, [plant.id, firstPhotoIndex]);
  useEffect(() => {
    setActiveIndex(firstPhotoIndex);
  }, [size, firstPhotoIndex]);
  function showPhoto(index: number) {
    const next = Math.max(0, Math.min(plant.photos.length - 1, index));
    gallery.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  }
  const names = <>
    <Text style={[styles.primaryName, principalName === "scientific" && styles.scientific, desktop && styles.desktopPrimaryName]}>
      {formatPlantNameForWrap(getPlantName(plant, principalName), principalName)}
    </Text>
    <Text style={[styles.secondaryName, principalName === "common" && styles.scientific, desktop && styles.desktopSecondaryName]}>
      {principalName === "common"
        ? `${plant.scientificName} ${plant.authorship}`.trim()
        : formatPlantNameForWrap(plant.commonName)}
    </Text>
  </>;
  const municipalSection = (
    !!plant.municipalEvidence?.length && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ocorrência no Município do Rio</Text>
        {plant.municipalEvidence.map((e, index) => (
          <View key={`${e.scientificName}:${index}`} style={styles.municipalRecord}>
            {plant.rank === "genus" && <Text style={[styles.body, styles.scientific]}>{e.scientificName}</Text>}
            <Text style={styles.body}>{e.locality}</Text>
            <Pressable accessibilityRole="link" onPress={() => openUrl(e.source.url)}>
              <Text style={styles.link}>{e.source.title} · {e.publicationYear} · {e.sourceLocator} ↗</Text>
            </Pressable>
          </View>
        ))}
      </View>
    )
  );
  return (
    <View style={styles.screen}>
      {desktop && (
        <View style={styles.profileNavigation} testID="profile-sticky-navigation">
          <Pressable accessibilityRole="button" accessibilityLabel="Ficha anterior" disabled={!onPrevious}
            onPress={onPrevious} style={[styles.profileNavigationButton, !onPrevious && styles.disabled]}>
            <BackIcon size={26} color={palette.ink} /><Text style={styles.profileNavigationLabel}>Anterior</Text>
          </Pressable>
          <View style={styles.desktopProfileNames} testID="profile-sticky-names">{names}<Text style={styles.desktopFamily}>{plant.family}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Próxima ficha" disabled={!onNext}
            onPress={onNext} style={[styles.profileNavigationButton, styles.profileNavigationNext, !onNext && styles.disabled]}>
            <Text style={styles.profileNavigationLabel}>Próxima</Text><View style={styles.nextArrow}><BackIcon size={26} color={palette.ink} /></View>
          </Pressable>
        </View>
      )}
      <Animated.ScrollView
        testID="plant-profile-scroll"
        style={[styles.screen, { transform: [{ translateX }] }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
      <View style={[styles.profile, desktop && styles.desktopProfile]}>
        <View style={desktop ? { width: galleryWidth } : undefined}
          onLayout={(event) => setSize(event.nativeEvent.layout.width)}>
        {plant.photos.length ? (
          <>
            <View testID="profile-photo-gallery">
            <PhotoDragArea enabled={desktop} index={activeIndex} count={plant.photos.length} onChange={showPhoto}>
            <FlatList
              key={`${plant.id}:${size}:${firstPhotoIndex}`}
              initialScrollIndex={firstPhotoIndex}
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
              renderItem={({ item, index }) => (
                <PhotoFrame photo={item} name={plant.commonName} size={size} desktop={desktop} onOpen={() => setViewerIndex(index)} />
              )}
            />
            </PhotoDragArea>
            {desktop && plant.photos.length > 1 && (
              <>
                <Pressable accessibilityRole="button" accessibilityLabel="Foto anterior"
                  disabled={activeIndex === 0} accessibilityState={{ disabled: activeIndex === 0 }}
                  onPress={() => showPhoto(activeIndex - 1)}
                  style={[styles.desktopPhotoArrow, { left: -22, top: size / 2 - 22 }, activeIndex === 0 && styles.photoArrowDisabled]}>
                  <BackIcon size={26} color={palette.white} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Foto seguinte"
                  disabled={activeIndex === plant.photos.length - 1} accessibilityState={{ disabled: activeIndex === plant.photos.length - 1 }}
                  onPress={() => showPhoto(activeIndex + 1)}
                  style={[styles.desktopPhotoArrow, { right: -22, top: size / 2 - 22 }, activeIndex === plant.photos.length - 1 && styles.photoArrowDisabled]}>
                  <View style={styles.nextArrow}><BackIcon size={26} color={palette.white} /></View>
                </Pressable>
              </>
            )}
            </View>
            {desktop && plant.photos.length > 1 && <Text style={styles.dragHint}>Arraste para mudar de foto · Clique para ampliar</Text>}
            {activePhoto && (plant.rank === "genus" || (!desktop && activePhoto.caption)) && (
              <View style={styles.photoCaption}>
                {plant.rank === "genus" && (
                  <Text style={[styles.muted, styles.scientific]}>{activePhoto.taxonName}</Text>
                )}
                {!desktop && !!activePhoto.caption && <Text style={styles.muted}>{activePhoto.caption}</Text>}
              </View>
            )}
            {plant.photos.length > 1 && (
              <View style={styles.galleryNavigation}>
                {!desktop && <Pressable
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
                </Pressable>}
                <View style={styles.dots}>
                  {desktop && <Text style={styles.photoCount}>{activeIndex + 1} / {plant.photos.length}</Text>}
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
                {!desktop && <Pressable
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
                </Pressable>}
              </View>
            )}
          </>
        ) : plant.presentation !== "checklist" ? (
          <View style={[styles.emptyPhoto, { height: size }]}>
            <BrandLeafIcon size={74} color={palette.pine} />
            <Text style={styles.muted}>Foto em preparação</Text>
          </View>
        ) : null}
        </View>
        <View style={desktop && styles.desktopInformation} testID="profile-information" {...(!desktop ? swipe.panHandlers : {})}>
        <View style={[styles.identity, desktop && styles.desktopIdentity]} testID="profile-identity-details">
          {!desktop && names}
          <View style={styles.identityMeta}>
            {!desktop && <Text style={styles.muted}>{plant.family}</Text>}
            {!desktop && <Text style={styles.muted}>
              {plant.geography === "rio-city" ? "Município do Rio" : "Estado do RJ"}
            </Text>}
            {plant.origin !== "native" && (
              <View style={styles.origin}>
                <Text style={styles.originText}>
                  {plant.origin === "invasive" ? "!  " : ""}
                  {originLabels[plant.origin]}
                </Text>
              </View>
            )}
          </View>
          {plant.reviewStatus === "draft" && <Text style={styles.review}>Conteúdo em revisão</Text>}
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
          <Section title="Onde cresce">
            <Text style={styles.body}>{plant.ecology}</Text>
          </Section>
        )}
        <Section title={plant.rank === "genus" ? "Nomes registrados entre os membros" : "Outros nomes"}>
          <Text style={styles.body}>
            {plant.alternateNames.length
              ? plant.alternateNames.join(", ")
              : "Sem outros nomes cadastrados."}
          </Text>
        </Section>
        <ConservationStatus plant={plant} />
        {plant.rank === "genus" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {plant.regionalSpecies.length} espécies neste grupo
            </Text>
            <Text style={styles.muted}>
              Seleção de espécies nativas com registro estadual; não representa
              uma contagem municipal nem o total do gênero. A data e o recorte
              da seleção estão na descrição.
            </Text>
            {plant.regionalSpecies.map((member) => {
              const codes = conservationCodesForSpecies(plant, member.scientificName);
              return <Text key={member.floraId} style={styles.member}>
                {member.scientificName} · {member.substrates.join(", ")}{codes.length ? ` · ${codes.join(", ")}` : ""}
              </Text>;
            })}
          </View>
        )}
        {plant.rank === "genus" && (plant.regionalEvidence ?? []).some((record) => record.endemicToRioState) && (
          <Section title="Endemismo no estado do RJ">
            {(plant.regionalEvidence ?? []).filter((record) => record.endemicToRioState).map((record) => (
              <Text key={record.scientificName} style={styles.member}>{record.scientificName} · publicação de {record.publicationYear}</Text>
            ))}
          </Section>
        )}
        {plant.rank !== "genus" && municipalSection}
        <RegionalRecords key={plant.id} plant={plant} onOpenUnit={onOpenUnit} unitHref={unitHref} />
        {relatedPlants.some((p) => p.id !== plant.id) && onOpenPlant && (
          <Section title="Outras do Gênero">
            {relatedPlants.filter((p) => p.id !== plant.id).map((p) => (
              <Pressable key={p.id} style={styles.relatedLink} accessibilityRole="button"
                accessibilityLabel={`Abrir ${p.scientificName}`} onPress={() => onOpenPlant(p)}>
                <Text style={[styles.body, { flex: 1 }]}>{p.commonName} · {p.scientificName}</Text>
                <ForwardIcon color={palette.pine} size={25} />
              </Pressable>
            ))}
          </Section>
        )}
        {plant.rank === "genus" && municipalSection}
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
      </View>
      {viewerIndex !== null && (
        <PhotoViewer
          key={plant.id}
          photos={plant.photos}
          initialIndex={viewerIndex}
          name={plant.commonName}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </Animated.ScrollView>
    </View>
  );
}
function PhotoFrame({
  photo,
  name,
  size,
  desktop,
  onOpen,
}: {
  photo: PlantPhoto;
  name: string;
  size: number;
  desktop: boolean;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.photo, { width: size, height: size }]}>
      {!failed && plantImages[photo.fileName] ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ampliar foto de ${name}`}
          accessibilityHint="Abre a foto em tela cheia. Use dois dedos ou dois toques para ampliar."
          onPress={onOpen}
          style={styles.photoImage}
        >
          <Image
            source={plantImages[photo.fileName]}
            accessibilityLabel={`${name}: ${photo.caption || "foto iNaturalist"}`}
            style={styles.photoImage}
            resizeMode="contain"
            onError={() => setFailed(true)}
          />
        </Pressable>
      ) : (
        <View style={styles.photoFallback}>
          <BrandLeafIcon size={64} color={palette.pine} />
          <Text style={styles.muted}>Foto em preparação</Text>
        </View>
      )}
      {desktop ? (
        <View style={styles.desktopPhotoMetadata} testID={`photo-metadata-${photo.id}`} pointerEvents="box-none">
          <View style={styles.desktopPhotoMarkers}><PlantPhotoMarkers markers={photo.markers} inline /></View>
          <View style={styles.desktopCaptionSpace} pointerEvents="none">
            {!!photo.caption && <Text style={styles.desktopPhotoCaption}>{photo.caption}</Text>}
          </View>
          <View style={styles.desktopPhotoCredit}><PhotoCredit photo={photo} /></View>
        </View>
      ) : <>
        <PlantPhotoMarkers markers={photo.markers} />
        <View style={styles.credit}><PhotoCredit photo={photo} /></View>
      </>}
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
  const {width}=useWindowDimensions();
  const desktop=Platform.OS==='web'&&width>=1024;
  return (
    <View style={[styles.section, desktop && styles.desktopSection]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  relatedLink: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.border, flexDirection: "row", alignItems: "center", gap: 8 },
  municipalRecord: { paddingVertical: 12, gap: 4, borderBottomWidth: 1, borderBottomColor: palette.border },
  screen: { flex: 1, backgroundColor: palette.paper },
  content: { paddingBottom: 20 },
  profile: { width: "100%", maxWidth: 640, alignSelf: "center" },
  desktopProfile: { maxWidth: 1440, paddingHorizontal: 24, flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: 24 },
  desktopInformation: { flex: 1, minWidth: 0, maxWidth: 660 },
  desktopIdentity: { paddingTop: 0, paddingBottom: 10 },
  desktopSection: { paddingVertical: 14 },
  profileNavigation: { flexShrink: 0, width: "100%", maxWidth: 1440, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingHorizontal: 24, paddingVertical: 6, minHeight: 68 },
  desktopProfileNames: { flex: 1, minWidth: 0, alignItems: "center", gap: 2 },
  desktopPrimaryName: { fontSize: 21, lineHeight: 26, textAlign: "center" },
  desktopSecondaryName: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  desktopFamily: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  dragHint: { color: palette.muted, fontSize: 11, paddingHorizontal: 16, paddingTop: 8 },
  profileNavigationButton: { width: 112, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 6 },
  profileNavigationNext: { justifyContent: "flex-end" },
  profileNavigationLabel: { color: palette.ink, fontSize: 14, fontWeight: "600" },
  nextArrow: { transform: [{ rotate: "180deg" }] },
  desktopPhotoArrow: { position: "absolute", zIndex: 2, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: palette.paper, backgroundColor: palette.ink, borderRadius: 22, boxShadow: "0 2px 8px rgba(36,49,39,0.22)" },
  photoArrowDisabled: { opacity: 0.4 },
  photoCount: { color: palette.ink, fontSize: 13, marginRight: 12 },
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
    maxWidth: "65%",
    backgroundColor: "rgba(36,49,39,0.72)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  creditText: { color: palette.paper, fontSize: 9, lineHeight: 12 },
  photoCaption: { paddingHorizontal: 16, paddingTop: 8, gap: 3 },
  desktopPhotoMetadata: { position: "absolute", left: 8, right: 8, bottom: 8, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  desktopPhotoMarkers: { maxWidth: "26%", flexShrink: 0 },
  desktopCaptionSpace: { flex: 1, minWidth: 0, alignItems: "center" },
  desktopPhotoCaption: { color: palette.paper, fontSize: 11, lineHeight: 16, textAlign: "center", backgroundColor: "rgba(36,49,39,0.82)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  desktopPhotoCredit: { maxWidth: "30%", backgroundColor: "rgba(36,49,39,0.72)", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
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
