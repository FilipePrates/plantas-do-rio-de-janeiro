import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
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
  BrandLeafIcon,
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
import { CatalogBrowser } from "./src/components/CatalogBrowser";
import { browserReducer, initialBrowserState, filterBrowserRows, conservationUnitIndex } from "./src/catalogBrowser.mjs";
import type { BrowserSection } from "./src/catalogBrowser.mjs";
import { formatPlantNameForWrap, getPlantName, getMainPhoto, mainPhotoKinds } from "./src/presentation.mjs";

const catalog = parseCatalog(catalogJson);
const allIds = new Set(catalog.plants.map((p) => p.id));
const profiles = catalog.plants.filter(isProfile);
const byName = [...catalog.plants].sort((a, b) =>
  a.commonName.localeCompare(b.commonName, "pt-BR"),
);
const byFamily = [...catalog.plants].sort(
  (a, b) =>
    a.family.localeCompare(b.family) ||
    a.scientificName.localeCompare(b.scientificName),
);
const byScientificName = [...catalog.plants].sort((a, b) =>
  a.scientificName.localeCompare(b.scientificName, "pt-BR"),
);
const speciesRows = checklistRows(catalog);
const familyEntries = [...new Set(catalog.plants.map((plant) => plant.family))]
  .sort((a, b) => a.localeCompare(b, "pt-BR"))
  .map((name) => ({
    name,
    speciesCount: speciesRows.filter((row) => row.family === name).length,
  }));
const unitEntries = conservationUnitIndex(speciesRows);
const habitatNames = [...new Set(catalog.plants.flatMap((plant) => plant.habitats))]
  .sort((a, b) => a.localeCompare(b, "pt-BR"));
const allFamilies = new Set(familyEntries.map((family) => family.name));
type Tab = "guide" | "families" | "habitats";
type Icon = typeof LeafIcon;
type GuideScope = { plantIds: string[]; label: string } | null;
type GuideReturn = {
  tab: Tab;
  query: string;
  habitat: string;
  familyFilter: string | null;
  scope: GuideScope;
};
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
  const [browser, dispatchBrowser] = useReducer(browserReducer, initialBrowserState);
  const browserRows = useMemo(() => filterBrowserRows(speciesRows, browser),
    [browser.family, browser.queries.species]);
  const [tabLoading, setTabLoading] = useState(false);
  const tabTransition = useRef(0);
  const tabLoadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (tabLoadingTimer.current) clearTimeout(tabLoadingTimer.current); }, []);
  const [guideReturn, setGuideReturn] = useState<GuideReturn | null>(null);
  const [guideScope, setGuideScope] = useState<GuideScope>(null);
  const [detailSequence, setDetailSequence] = useState<Plant[]>([]);
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
      return goBack();
    });
    return () => handler.remove();
  }, [detailId, detailHistory, settings, tab, guideReturn, browser]);
  const visible = useMemo(
    () =>
      (saved.alphabetical
        ? saved.principalName === "scientific"
          ? byScientificName
          : byName
        : byFamily
      ).filter(
        (plant) =>
          (!guideScope || guideScope.plantIds.includes(plant.id)) &&
          matchesPlant(plant, query) &&
          (!saved.photosOnly || plant.photos.length > 0) &&
          (!saved.familyFilter || plant.family === saved.familyFilter) &&
          (!habitat || plant.habitats.includes(habitat)),
      ),
    [
      saved.alphabetical,
      saved.principalName,
      saved.familyFilter,
      saved.photosOnly,
      query,
      habitat,
      guideScope,
    ],
  );
  const detailPosition = detailSequence.findIndex((plant) => plant.id === detailId);
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
  function openPlant(plant: Plant, sequence = visible) {
    setDetailSequence(sequence);
    setDetailHistory([]);
    setDetailId(plant.id);
  }
  function rememberGuide() {
    setGuideReturn({ tab, query, habitat, familyFilter: saved.familyFilter, scope: guideScope });
  }
  function openSelectionInGuide(plants: Plant[], label: string) {
    rememberGuide();
    withTabLoading(() => {
      setGuideScope({ plantIds: plants.map((plant) => plant.id), label });
      setSaved((value) => ({ ...value, familyFilter: null }));
      setQuery("");
      setHabitat("");
      setTab("guide");
    });
  }
  function withTabLoading(action: () => void) {
    const transition = ++tabTransition.current;
    if (tabLoadingTimer.current) clearTimeout(tabLoadingTimer.current);
    setTabLoading(true);
    requestAnimationFrame(() => {
      if (tabTransition.current !== transition) return;
      action();
      tabLoadingTimer.current = setTimeout(() => {
        if (tabTransition.current === transition) setTabLoading(false);
      }, 100);
    });
  }
  function changeBrowserTab(section: BrowserSection) {
    if (browser.section === section && !browser.origin) return;
    withTabLoading(() => dispatchBrowser({ type: "tab", section }));
  }
  function restoreGuide() {
    if (!guideReturn) return;
    setQuery(guideReturn.query);
    setHabitat(guideReturn.habitat);
    setGuideScope(guideReturn.scope);
    setSaved((value) => ({ ...value, familyFilter: guideReturn.familyFilter }));
    setGuideReturn(null);
  }
  function goBack() {
    if (settings) setSettings(false);
    else if (detail) {
      setDetailId(detailHistory.at(-1) || null);
      setDetailHistory((history) => history.slice(0, -1));
    } else if (tab === "guide" && guideReturn) {
      setTab(guideReturn.tab);
      restoreGuide();
    } else if (tab === "families" && browser.section === "species" && browser.origin) {
      dispatchBrowser({ type: "back" });
    } else if (tab !== "guide") setTab("guide");
    else return false;
    return true;
  }
  const isSubscreen = Boolean(detail || settings);
  const title = settings ? "Configurações" : detail?.commonName || "Plantas";
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView edges={["top"]} style={styles.statusBarSafe}>
        <View style={styles.header}>
          {isSubscreen || (tab === "guide" && guideReturn) || (tab === "families" && browser.section === "species" && browser.origin) ? (
            <IconButton label="Voltar" icon={BackIcon} onPress={goBack} light />
          ) : tab === "guide" ? (
            <IconButton
              label={saved.advanced ? "Exibir grade" : "Exibir lista avançada"}
              icon={saved.advanced ? GridModeIcon : ListModeIcon}
              onPress={() => setSaved((v) => ({ ...v, advanced: !v.advanced }))}
              light
            />
          ) : (
            <View style={styles.iconButton} />
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
        <LoadingBrand />
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
          <Card title="Foto principal">
            <View style={styles.photoChoices}>
              {mainPhotoKinds.map((marker) => (
                <Pressable key={marker} accessibilityRole="radio"
                  accessibilityLabel={marker === "default" ? "Padrão" : markerLabels[marker]}
                  accessibilityState={{ checked: saved.mainPhoto === marker }}
                  onPress={() => setSaved((value) => ({ ...value, mainPhoto: marker }))}
                  style={[styles.photoChoice, saved.mainPhoto === marker && styles.photoChoiceSelected]}>
                  {marker === "default" ? <GridModeIcon size={26} color={palette.pine} /> : <PlantPhotoMarker marker={marker} />}
                  <Text style={styles.photoChoiceLabel}>{marker === "default" ? "Padrão" : markerLabels[marker]}</Text>
                  <Text style={styles.photoChoiceCheck}>{saved.mainPhoto === marker ? "✓" : " "}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.muted}>Sem esse tipo de foto, usa a padrão.</Text>
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
              Janeiro. Fotos: colaboradores do iNaturalist, sob CC0 ou CC BY 4.0.
              Toque no crédito de cada foto para consultar autor, origem e licença.
              Miniaturas redimensionadas e recortadas em quadrado.
              Seleção e textos em revisão.
            </Text>
          </Card>
        </ScrollView>
      ) : tab === "habitats" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Fitofisionomias</Text>
          <Text style={styles.body}>Explore os ambientes registrados no catálogo.</Text>
          {habitatNames.map((name) => (
            <Pressable key={name} accessibilityRole="button"
              accessibilityLabel={`Ver plantas de ${name} no guia`}
              style={styles.habitatRow}
              onPress={() => {
                rememberGuide();
                withTabLoading(() => {
                  setSaved((value) => ({ ...value, familyFilter: null }));
                  setGuideScope(null);
                  setHabitat(name);
                  setQuery("");
                  setTab("guide");
                });
              }}>
              <Text style={styles.habitatName}>{name}</Text>
              <Text style={styles.habitatArrow}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : tab === "families" ? (
        <View style={styles.flex} />
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
                accessibilityLabel="Buscar plantas ou unidades de conservação"
                placeholder="Buscar planta ou unidade…"
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
              {(saved.familyFilter || habitat || guideScope) && (
                <View style={styles.searchFilterPill}>
                  <Text style={styles.searchFilterText} numberOfLines={1}>
                    {saved.familyFilter || habitat || guideScope?.label}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remover filtro do guia"
                    onPress={() => {
                      setSaved((value) => ({ ...value, familyFilter: null }));
                      setHabitat("");
                      setGuideScope(null);
                    }}
                    hitSlop={8}
                    style={styles.searchFilterClear}
                  >
                    <Text style={styles.searchFilterClearText}>×</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          {saved.advanced ? (
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
                    <PlantArtwork plant={item} photo={getMainPhoto(item, saved.mainPhoto)} compact />
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
              extraData={saved}
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
                  <PlantArtwork plant={item} photo={getMainPhoto(item, saved.mainPhoto)} compact flush />
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
      {hydrated && (
        <View style={[styles.detailOverlay, (tab !== "families" || settings) && styles.hidden]}
          accessibilityElementsHidden={Boolean(detail)} importantForAccessibility={detail ? "no-hide-descendants" : "auto"}>
          <CatalogBrowser state={browser} dispatch={dispatchBrowser} rows={browserRows} allRows={speciesRows}
            families={familyEntries} units={unitEntries} onOpen={openPlant} onGuide={openSelectionInGuide}
            onTabChange={changeBrowserTab} />
        </View>
      )}
      {detail && !settings && (
        <View style={styles.detailOverlay}>
          <PlantProfile
            key={detail.id}
            plant={detail}
            principalName={saved.principalName}
            mainPhoto={saved.mainPhoto}
            onPrevious={detailPosition > 0
              ? () => setDetailId(detailSequence[detailPosition - 1].id) : undefined}
            onNext={detailPosition >= 0 && detailPosition < detailSequence.length - 1
              ? () => setDetailId(detailSequence[detailPosition + 1].id) : undefined}
            relatedPlants={catalog.plants.filter((p) => p.genus === detail.genus && isProfile(p))}
            onOpenPlant={(plant) => {
              setDetailHistory((history) => [...history, detail.id]);
              setDetailId(plant.id);
            }}
          />
        </View>
      )}
      {tabLoading && <View style={styles.tabLoadingOverlay}><LoadingBrand /></View>}
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
                if (tab === item.id && !detail && !settings) return;
                withTabLoading(() => {
                  setDetailId(null);
                  setDetailHistory([]);
                  setSettings(false);
                  restoreGuide();
                  setTab(item.id);
                });
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
function LoadingBrand() {
  return (
    <View style={styles.loadingBrand} accessibilityRole="progressbar" accessibilityLabel="Carregando Plantas do Rio de Janeiro">
      <View style={styles.loadingLogo}><BrandLeafIcon size={52} color={palette.pine} /></View>
    </View>
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
          <BrandLeafIcon size={compact ? 36 : 84} color={palette.pine} />
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
  hidden: { display: "none" },
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
  habitatRow: { minHeight: 58, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: palette.border, gap: 12 },
  habitatName: { flex: 1, color: palette.ink, fontSize: 16, lineHeight: 22, fontWeight: "600" },
  habitatArrow: { color: palette.pine, fontSize: 25 },
  tabLoadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 5, backgroundColor: palette.paper },
  loadingBrand: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.paper },
  loadingLogo: { width: 84, height: 84, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: palette.white },
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
  familyIndexTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  familyChecklistButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7, backgroundColor: palette.moss },
  familyChecklistButtonText: { color: palette.pine, fontWeight: "700", fontSize: 13 },
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
  photoChoices: { flexDirection: "row", flexWrap: "wrap" },
  photoChoice: { width: "25%", minHeight: 92, paddingVertical: 10, alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: "transparent" },
  photoChoiceSelected: { backgroundColor: palette.moss, borderColor: palette.pine },
  photoChoiceLabel: { color: palette.ink, fontSize: 11, textAlign: "center" },
  photoChoiceCheck: { color: palette.pine, fontSize: 12, lineHeight: 14 },
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
