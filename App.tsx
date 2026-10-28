import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  BackIcon,
  BookIcon,
  GridModeIcon,
  LeafIcon,
  ListIcon,
  ListModeIcon,
  SettingsIcon,
} from "./src/components/icons";
import {
  matchesPlant,
  markerLabels,
  parseCatalog,
  representedSpeciesCount,
  isProfile,
  hasMunicipalEvidence,
  checklistRows,
} from "./src/catalog.mjs";
import type { Plant, PlantPhoto } from "./src/catalog.mjs";
import catalogJson from "./src/data/plants.json";
import { plantImages } from "./src/data/plant-images";
import { plantThumbnails } from "./src/data/plant-thumbnails";
import { defaultState, loadState, saveState } from "./src/storage";
import { palette } from "./src/theme";
import { PlantProfile } from "./src/components/PlantProfile";
import { PlantPhotoMarker } from "./src/components/PlantPhotoMarkers";
import { SpeciesChecklist } from "./src/components/SpeciesChecklist";
import { formatPlantNameForWrap, getPlantName } from "./src/presentation.mjs";

const catalog = parseCatalog(catalogJson);
const allIds = new Set(catalog.plants.map((p) => p.id));
const profiles = catalog.plants.filter(isProfile);
const byName = [...profiles].sort((a, b) =>
  a.commonName.localeCompare(b.commonName, "pt-BR"),
);
const byFamily = [...profiles].sort(
  (a, b) =>
    a.family.localeCompare(b.family) ||
    a.scientificName.localeCompare(b.scientificName),
);
const byScientificName = [...profiles].sort((a, b) =>
  a.scientificName.localeCompare(b.scientificName, "pt-BR"),
);
const photographedPlants = profiles.filter((plant) => plant.photos.length > 0);
const speciesRows = checklistRows(catalog);
const familyEntries = [...new Set(catalog.plants.map((plant) => plant.family))]
  .sort((a, b) => a.localeCompare(b, "pt-BR"))
  .map((name) => ({
    name,
    count: profiles.filter((plant) => plant.family === name).length,
    speciesCount: speciesRows.filter((row) => row.family === name).length,
  }));
const allFamilies = new Set(familyEntries.map((family) => family.name));
const photoFamilyEntries = familyEntries
  .map((family) => ({
    ...family,
    count: photographedPlants.filter((plant) => plant.family === family.name).length,
  }))
  .filter((family) => family.count > 0);
const photoMarkerKinds = [
  "flower",
  "fruit",
  "leaf",
  "bark",
  "wholePlant",
  "seed",
  "root",
] as const;
type Tab = "guide" | "families" | "habitats";
type Icon = typeof LeafIcon;
export default function App() {
  return (
    <SafeAreaProvider>
      <Guide />
    </SafeAreaProvider>
  );
}

function Guide() {
  const [tab, setTab] = useState<Tab>("guide");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailHistory, setDetailHistory] = useState<string[]>([]);
  const [checklist, setChecklist] = useState(false);
  const [cityOnly, setCityOnly] = useState(false);
  const [settings, setSettings] = useState(false);
  const [query, setQuery] = useState("");
  const [habitat, setHabitat] = useState("");
  const { width } = useWindowDimensions();
  const [guideWidth, setGuideWidth] = useState(width);
  const gridCardSize = Math.max(1, (guideWidth - 4) / 3);
  const [saved, setSaved] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [saveEnabled, setSaveEnabled] = useState(true);
  const [familyQuery, setFamilyQuery] = useState("");
  const detail = catalog.plants.find((p) => p.id === detailId);
  useEffect(() => {
    let mounted = true;
    loadState(allIds, allFamilies, catalog.plants)
      .then((value) => {
        if (mounted) setSaved(value);
      })
      .catch(() => {
        if (mounted) {
          setSaveEnabled(false);
          setStorageError(
            "Não foi possível ler suas preferências. O arquivo original foi preservado.",
          );
        }
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!hydrated || !saveEnabled) return;
    try {
      saveState(saved);
      setStorageError("");
    } catch {
      setStorageError(
        "Não foi possível salvar suas alterações neste dispositivo.",
      );
    }
  }, [saved, hydrated, saveEnabled]);
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (detailId) {
        setDetailId(detailHistory.at(-1) || null);
        setDetailHistory((history) => history.slice(0, -1));
        return true;
      }
      if (settings) {
        setSettings(false);
        return true;
      }
      if (tab !== "guide") {
        setTab("guide");
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [detailId, detailHistory, settings, tab]);
  const visible = useMemo(
    () =>
      (saved.alphabetical
        ? saved.principalName === "scientific"
          ? byScientificName
          : byName
        : byFamily
      ).filter(
        (plant) =>
          matchesPlant(plant, query) &&
          (!cityOnly || hasMunicipalEvidence(plant)) &&
          (!saved.photosOnly || plant.photos.length > 0) &&
          (!saved.familyFilter || plant.family === saved.familyFilter) &&
          (!habitat || plant.habitats.some((h) => h.includes(habitat))),
      ),
    [
      saved.alphabetical,
      saved.principalName,
      saved.familyFilter,
      saved.photosOnly,
      query,
      habitat,
      cityOnly,
    ],
  );
  const sections = useMemo(() => {
    const groups = new Map<string, Plant[]>();
    for (const plant of visible) {
      const key = saved.alphabetical
        ? getPlantName(plant, saved.principalName)
            .charAt(0)
            .toLocaleUpperCase("pt-BR")
        : plant.family;
      groups.set(key, [...(groups.get(key) || []), plant]);
    }
    return [...groups].map(([title, data]) => ({ title, data }));
  }, [visible, saved.alphabetical, saved.principalName]);
  function openPlant(plant: Plant) {
    setDetailHistory([]);
    setDetailId(plant.id);
  }
  function selectFamily(family: string | null) {
    setSaved((value) => ({ ...value, familyFilter: family }));
    setQuery("");
    setHabitat("");
    setTab("guide");
    if (family && !profiles.some((plant) => plant.family === family)) setChecklist(true);
  }
  function goBack() {
    if (detail) {
      setDetailId(detailHistory.at(-1) || null);
      setDetailHistory((history) => history.slice(0, -1));
    }
    else if (settings) setSettings(false);
  }
  const isSubscreen = Boolean(detail || settings);
  const title = detail?.commonName || (settings ? "Configurações" : "Plantas");
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView edges={["top"]} style={styles.statusBarSafe}>
        <View style={styles.header}>
          {isSubscreen ? (
            <IconButton label="Voltar" icon={BackIcon} onPress={goBack} light />
          ) : tab === "guide" ? (
            <IconButton
              label={saved.advanced ? "Exibir grade" : "Exibir lista avançada"}
              icon={saved.advanced ? GridModeIcon : ListModeIcon}
              onPress={() => setSaved((v) => ({ ...v, advanced: !v.advanced }))}
              light
            />
          ) : (
            <View style={styles.iconButton}>
              <LeafIcon size={24} color={palette.paper} />
            </View>
          )}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {formatPlantNameForWrap(title)}
            </Text>
            {!isSubscreen && (
              <Text style={styles.headerSubtitle}>do Rio de Janeiro</Text>
            )}
          </View>
          {!settings && (
            <IconButton
              label="Configurações"
              icon={SettingsIcon}
              onPress={() => {
                setDetailId(null);
                setDetailHistory([]);
                setSettings(true);
              }}
              light
            />
          )}
          {settings && <View style={styles.iconButton} />}
        </View>
      </SafeAreaView>
      {!!storageError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {storageError}
        </Text>
      )}
      <View style={styles.flex}>
      {!hydrated ? (
        <ActivityIndicator
          style={styles.loading}
          color={palette.pine}
          size="large"
        />
      ) : settings ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Card title="Exibição">
            <Text style={styles.settingLabel}>Nome principal</Text>
            <View style={styles.wrap}>
              <Chip
                text="Português"
                selected={saved.principalName === "common"}
                onPress={() =>
                  setSaved((v) => ({ ...v, principalName: "common" }))
                }
              />
              <Chip
                text="Científico"
                selected={saved.principalName === "scientific"}
                onPress={() =>
                  setSaved((v) => ({ ...v, principalName: "scientific" }))
                }
              />
            </View>
            <Setting
              label="Modo avançado: lista por família"
              value={saved.advanced}
              onChange={(advanced) => setSaved((v) => ({ ...v, advanced }))}
            />
            <Setting
              label="Ordenar pelo nome principal"
              value={saved.alphabetical}
              onChange={(alphabetical) =>
                setSaved((v) => ({ ...v, alphabetical }))
              }
            />
            <Setting
              label="Mostrar apenas plantas com fotos"
              value={saved.photosOnly}
              onChange={(photosOnly) =>
                setSaved((v) => ({ ...v, photosOnly }))
              }
            />
          </Card>
          <Card title="Ícones das fotos">
            {photoMarkerKinds.map((marker) => (
              <View key={marker} style={styles.legendRow}>
                <PlantPhotoMarker marker={marker} />
                <Text style={styles.body}>{markerLabels[marker]}</Text>
              </View>
            ))}
          </Card>
          <Card title="Sobre o guia">
            <Text style={styles.body}>
              Flora nativa da Mata Atlântica do Rio de Janeiro, com invasoras
              selecionadas para reconhecimento. {profiles.length} fichas ilustradas
              e {catalog.plants.length - profiles.length} entradas de referência
              representam {representedSpeciesCount(catalog)} espécies neste rascunho,
              incluindo os membros dos grupos, sem duplicação.
            </Text>
            <Text style={styles.body}>
              O catálogo e as fotos incluídas funcionam sem internet. Os links
              de referência abrem o navegador.
            </Text>
            <Text style={styles.muted}>
              Dados: Flora e Funga do Brasil / Jardim Botânico do Rio de
              Janeiro. Fotos: colaboradores do iNaturalist, exclusivamente CC0.
              Seleção e textos em revisão.
            </Text>
          </Card>
        </ScrollView>
      ) : tab === "habitats" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Fitofisionomias</Text>
          <Text style={styles.body}>Explore as plantas pelo ambiente.</Text>
          <Pressable
            style={styles.card}
            accessibilityRole="button"
            onPress={() => {
              setSaved((value) => ({ ...value, familyFilter: null }));
              setHabitat("Floresta Ombrófila");
              setQuery("");
              setTab("guide");
            }}
          >
            <LeafIcon color={palette.pine} size={34} />
            <Text style={styles.sectionTitle}>Floresta ombrófila</Text>
            <Text style={styles.muted}>
              Plantas de florestas úmidas · Abrir guia
            </Text>
          </Pressable>
          {[
            "Restinga",
            "Manguezal",
            "Afloramentos rochosos",
            "Floresta estacional",
          ].map((name) => (
            <View key={name} style={[styles.card, styles.locked]}>
              <Text style={styles.sectionTitle}>{name}</Text>
              <Text style={styles.muted}>Módulo em preparação</Text>
            </View>
          ))}
        </ScrollView>
      ) : tab === "families" ? (
        <View style={styles.flex}>
          <View style={styles.familyIndexHeader}>
            <Text style={styles.sectionTitle}>Famílias</Text>
            <TextInput
              accessibilityLabel="Buscar famílias"
              placeholder="Buscar família..."
              placeholderTextColor={palette.muted}
              value={familyQuery}
              onChangeText={setFamilyQuery}
              style={styles.input}
            />
          </View>
          <FlatList
            data={(saved.photosOnly ? photoFamilyEntries : familyEntries).filter(
              (family) =>
                family.name
                  .toLocaleLowerCase("pt-BR")
                  .includes(familyQuery.trim().toLocaleLowerCase("pt-BR")),
            )}
            keyExtractor={(family) => family.name}
            extraData={saved.familyFilter}
            contentContainerStyle={styles.familyIndexContent}
            ListHeaderComponent={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mostrar todas as famílias"
                accessibilityState={{ selected: !saved.familyFilter }}
                onPress={() => selectFamily(null)}
                style={[
                  styles.familyIndexRow,
                  !saved.familyFilter && styles.familyIndexSelected,
                ]}
              >
                <Text style={[styles.name, styles.flex]}>
                  Todas as famílias
                </Text>
                <Text style={styles.muted}>
                  {saved.photosOnly
                    ? photographedPlants.length
                    : profiles.length}{" "}
                  fichas
                </Text>
                <Text style={styles.familyIndexIndicator}>
                  {!saved.familyFilter ? "✓" : "›"}
                </Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${item.name}`}
                accessibilityState={{
                  selected: saved.familyFilter === item.name,
                }}
                onPress={() => selectFamily(item.name)}
                style={[
                  styles.familyIndexRow,
                  saved.familyFilter === item.name &&
                    styles.familyIndexSelected,
                ]}
              >
                <Text style={[styles.name, styles.flex]}>{item.name}</Text>
                <Text style={styles.muted}>
                  {item.count ? `${item.count} fichas` : `${item.speciesCount} espécies · lista`}
                </Text>
                <Text style={styles.familyIndexIndicator}>
                  {saved.familyFilter === item.name ? "✓" : "›"}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={<Empty text="Nenhuma família encontrada." />}
          />
        </View>
      ) : (
        <View
          style={styles.flex}
          onLayout={(event) => setGuideWidth(event.nativeEvent.layout.width)}
          accessibilityElementsHidden={Boolean(detail)}
          importantForAccessibility={detail ? "no-hide-descendants" : "auto"}
        >
          <View style={styles.searchRow}>
            <View style={styles.searchInputShell}>
              <TextInput
                accessibilityLabel="Buscar plantas"
                placeholder={
                  saved.familyFilter
                    ? "Buscar planta..."
                    : "Digite o nome da planta aqui..."
                }
                placeholderTextColor={palette.muted}
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
              />
              {!!query && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                  onPress={() => setQuery("")}
                  hitSlop={4}
                  style={styles.searchClear}
                >
                  <Text style={styles.searchClearText}>×</Text>
                </Pressable>
              )}
              {!!saved.familyFilter && (
                <View style={styles.searchFilterPill}>
                  <Text style={styles.searchFilterText} numberOfLines={1}>
                    {saved.familyFilter}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remover filtro de família"
                    onPress={() =>
                      setSaved((value) => ({ ...value, familyFilter: null }))
                    }
                    hitSlop={8}
                    style={styles.searchFilterClear}
                  >
                    <Text style={styles.searchFilterClearText}>×</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          <View style={styles.catalogControls}>
            <Chip text="Guia ilustrado" selected={!checklist} onPress={() => setChecklist(false)} />
            <Chip text="Lista de espécies" selected={checklist} onPress={() => setChecklist(true)} />
            <Chip text="Registro municipal" selected={cityOnly} onPress={() => setCityOnly((value) => !value)} />
          </View>
          {cityOnly && !checklist && <Text style={styles.scopeHint}>Nos grupos, o registro municipal vale apenas para os membros documentados.</Text>}
          {!checklist && !!habitat && (
            <View style={styles.activeHabitat}>
              <Chip
                text="Floresta ombrófila ×"
                onPress={() => setHabitat("")}
              />
            </View>
          )}
          {checklist ? (
            <SpeciesChecklist catalog={catalog} query={query} family={saved.familyFilter}
              cityOnly={cityOnly} onOpen={openPlant} />
          ) : saved.advanced ? (
            <SectionList
              sections={sections}
              keyExtractor={(p) => p.id}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={styles.advancedListContent}
              renderSectionHeader={({ section }) => (
                <Text style={styles.familyHeading}>{section.title}</Text>
              )}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.plantRow}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${item.commonName}`}
                  onPress={() => openPlant(item)}
                >
                  <View style={styles.rowArt}>
                    <PlantArtwork plant={item} compact />
                  </View>
                  <View style={styles.flex}>
                    <Text
                      style={[
                        styles.name,
                        saved.principalName === "scientific" &&
                          styles.italicName,
                      ]}
                    >
                      {formatPlantNameForWrap(
                        getPlantName(item, saved.principalName),
                        saved.principalName,
                      )}
                    </Text>
                    <Text
                      style={
                        saved.principalName === "scientific"
                          ? styles.rowSecondaryName
                          : styles.scientificSmall
                      }
                    >
                      {saved.principalName === "scientific"
                        ? item.commonName
                        : item.scientificName}
                    </Text>
                    {!!item.alternateNames.length && (
                      <Text style={styles.rowSecondaryName} numberOfLines={1}>
                        {item.alternateNames.join(" · ")}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={<Empty text="Nenhuma planta encontrada." />}
            />
          ) : (
            <FlatList
              key={`grid-${gridCardSize}`}
              numColumns={3}
              extraData={saved.principalName}
              data={visible}
              keyExtractor={(p) => p.id}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.gridCard,
                    { width: gridCardSize, height: gridCardSize },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${getPlantName(item, saved.principalName)}${item.origin === "invasive" ? ", exótica invasora" : ""}`}
                  testID={`plant-grid-${item.id}`}
                  onPress={() => openPlant(item)}
                >
                  <PlantArtwork plant={item} compact flush />
                  <View style={styles.gridLabelWrap}>
                    <Text
                      style={[
                        styles.gridLabel,
                        saved.principalName === "scientific" &&
                          styles.italicName,
                      ]}
                      textBreakStrategy="simple"
                      android_hyphenationFrequency="none"
                    >
                      {formatPlantNameForWrap(
                        getPlantName(item, saved.principalName),
                        saved.principalName,
                      )}
                    </Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={<Empty text="Nenhuma planta encontrada." />}
            />
          )}
        </View>
      )}
      {detail && (
        <View style={styles.detailOverlay}>
          <PlantProfile
            key={detail.id}
            plant={detail}
            principalName={saved.principalName}
            relatedPlants={catalog.plants.filter((p) => p.genus === detail.genus && isProfile(p))}
            onOpenPlant={(plant) => {
              setDetailHistory((history) => [...history, detail.id]);
              setDetailId(plant.id);
            }}
          />
        </View>
      )}
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.navSafe}>
        <View style={styles.nav}>
          {(
            [
              { id: "families", label: "Famílias", icon: ListIcon },
              { id: "guide", label: "Guia", icon: BookIcon },
              { id: "habitats", label: "Fitofisionomias", icon: LeafIcon },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item.id }}
              accessibilityLabel={item.label}
              style={styles.navItem}
              onPress={() => {
                setDetailId(null);
                setDetailHistory([]);
                setSettings(false);
                setTab(item.id);
              }}
            >
              <View
                style={[
                  styles.navIconWrap,
                  tab === item.id && styles.navSelected,
                ]}
              >
                <item.icon
                  size={25}
                  color={tab === item.id ? palette.pine : palette.muted}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
function PlantArtwork({
  plant,
  photo = plant.photos[0],
  compact = false,
  flush = false,
}: {
  plant: Plant;
  photo?: PlantPhoto;
  compact?: boolean;
  flush?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo?.fileName]);
  const source =
    photo &&
    (compact
      ? plantThumbnails[photo.fileName] || plantImages[photo.fileName]
      : plantImages[photo.fileName]);
  return (
    <View style={[styles.artwork, flush && styles.gridArtwork]}>
      {source && !failed ? (
        <Image
          accessibilityLabel={`${plant.commonName}: ${photo.caption || "foto iNaturalist"}`}
          source={source}
          style={styles.image}
          resizeMode={compact ? "cover" : "contain"}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <LeafIcon size={compact ? 36 : 84} color={palette.pine} />
          {!compact && <Text style={styles.muted}>Foto em preparação</Text>}
        </View>
      )}
      {compact && plant.origin === "invasive" && (
        <View
          style={styles.invasiveDot}
          accessibilityRole="image"
          accessibilityLabel="Exótica invasora"
        >
          <Text style={styles.invasiveText}>!</Text>
        </View>
      )}
    </View>
  );
}
function IconButton({
  label,
  icon: Component,
  onPress,
  light = false,
}: {
  label: string;
  icon: Icon;
  onPress: () => void;
  light?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Component size={24} color={light ? palette.paper : palette.pine} />
    </Pressable>
  );
}
function Chip({
  text,
  onPress,
  selected = false,
}: {
  text: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {text}
      </Text>
    </Pressable>
  );
}
function Badge({
  text,
  invasive = false,
}: {
  text: string;
  invasive?: boolean;
}) {
  return (
    <View style={[styles.badge, invasive && styles.invasiveBadge]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Setting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.setting}>
      <Text style={[styles.body, styles.flex]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: palette.pine }}
      />
    </View>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <LeafIcon color={palette.sage} size={40} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}
function openUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

const styles = StyleSheet.create({
  scopeHint: { color: palette.muted, fontSize: 12, lineHeight: 17, paddingHorizontal: 12, paddingBottom: 8 },
  catalogControls: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 10, paddingBottom: 8 },
  safe: { flex: 1, backgroundColor: palette.sand },
  statusBarSafe: { backgroundColor: "#000000" },
  flex: { flex: 1 },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.paper,
  },
  header: {
    minHeight: 76,
    backgroundColor: palette.pine,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerTitleWrap: { flex: 1, minWidth: 0, alignItems: "center", gap: 2 },
  headerTitle: {
    width: "100%",
    textAlign: "center",
    color: palette.white,
    fontSize: 23,
    fontWeight: "800",
  },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.86)" },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  loading: { flex: 1 },
  searchRow: {
    backgroundColor: palette.moss,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchInputShell: {
    backgroundColor: palette.paper,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: palette.ink,
    fontSize: 15,
    lineHeight: 19,
  },
  searchClear: {
    width: 32,
    height: 32,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  searchClearText: { color: palette.muted, fontSize: 24, lineHeight: 28 },
  searchFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "52%",
    borderRadius: 20,
    backgroundColor: palette.moss,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 5,
  },
  searchFilterText: {
    color: palette.pine,
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  searchFilterClear: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(36,49,39,0.1)",
  },
  searchFilterClearText: { color: palette.pine, fontSize: 18, lineHeight: 22 },
  input: {
    backgroundColor: palette.paper,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    color: palette.ink,
    fontSize: 16,
  },
  activeHabitat: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    backgroundColor: palette.moss,
  },
  chip: {
    backgroundColor: palette.paper,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignSelf: "flex-start",
    minHeight: 38,
  },
  chipSelected: { backgroundColor: palette.pine, borderColor: palette.pine },
  chipText: { color: palette.ink, fontSize: 13 },
  chipTextSelected: { color: palette.white },
  grid: { paddingHorizontal: 1, paddingTop: 1, paddingBottom: 12, gap: 1 },
  gridRow: { gap: 1, justifyContent: "flex-start" },
  gridCard: {
    backgroundColor: palette.paper,
    borderRadius: 0,
    overflow: "hidden",
  },
  gridArtwork: { borderRadius: 0 },
  gridLabelWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(36,49,39,0.5)",
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  gridLabel: {
    color: palette.white,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  italicName: { fontStyle: "italic" },
  artwork: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: palette.moss,
    position: "relative",
    overflow: "hidden",
    borderRadius: 7,
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    gap: 7,
  },
  photoMarkers: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    gap: 5,
  },
  invasiveDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF7FA4",
  },
  invasiveText: {
    color: palette.white,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    includeFontPadding: false,
  },
  identity: { gap: 5 },
  title: { fontSize: 25, color: palette.ink, fontWeight: "700" },
  scientific: { fontSize: 16, fontStyle: "italic", color: palette.muted },
  scientificSmall: {
    fontStyle: "italic",
    color: palette.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  rowSecondaryName: { color: palette.muted, fontSize: 12, lineHeight: 16 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingTop: 5 },
  badge: {
    backgroundColor: palette.moss,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  badgeText: { color: palette.ink, fontSize: 11 },
  invasiveBadge: { backgroundColor: "#EEDDBF" },
  card: {
    backgroundColor: palette.paper,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 9,
  },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: "700" },
  body: { color: palette.ink, fontSize: 15, lineHeight: 23 },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  link: {
    color: palette.pine,
    fontSize: 13,
    lineHeight: 22,
    textDecorationLine: "underline",
  },
  thumbnails: { gap: 8 },
  thumbnail: {
    width: 68,
    height: 68,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 9,
    overflow: "hidden",
  },
  selectedThumbnail: { borderColor: palette.pine },
  thumbnailImage: { width: "100%", height: "100%" },
  credit: { gap: 3 },
  member: {
    fontSize: 12,
    color: palette.muted,
    fontStyle: "italic",
    lineHeight: 19,
  },
  nav: {
    flexDirection: "row",
    backgroundColor: palette.paper,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  navSafe: { backgroundColor: palette.paper },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navSelected: { backgroundColor: "#EEF3E3" },
  settingLabel: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  advancedListContent: { paddingHorizontal: 8, paddingBottom: 12 },
  familyHeading: {
    fontSize: 16,
    lineHeight: 20,
    color: palette.pine,
    fontWeight: "700",
    paddingTop: 10,
    paddingBottom: 4,
  },
  plantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.paper,
    padding: 6,
    borderRadius: 6,
    marginBottom: 3,
  },
  rowArt: { width: 60 },
  name: { color: palette.ink, fontWeight: "700", fontSize: 14, lineHeight: 18 },
  familyIndexHeader: { padding: 12, gap: 10 },
  familyIndexContent: { paddingHorizontal: 8, paddingBottom: 12 },
  familyIndexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  familyIndexSelected: { backgroundColor: palette.moss, borderRadius: 6 },
  familyIndexIndicator: {
    width: 16,
    textAlign: "center",
    color: palette.pine,
    fontSize: 18,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  setting: { flexDirection: "row", alignItems: "center", gap: 12 },
  empty: { padding: 30, gap: 12, alignItems: "center" },
  locked: { opacity: 0.55 },
  error: {
    backgroundColor: "#EEDDBF",
    color: palette.ink,
    padding: 10,
    fontSize: 12,
  },
});
