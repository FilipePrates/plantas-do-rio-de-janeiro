# Plantas do Rio de Janeiro

Independent offline-first Expo + React Native + TypeScript guide, adapted from
the structure and palette of Aves do Brasil. This is a development draft, not
an App Store or Play release. No bird project files or services are changed.

## Start

Node 20.19.4+ within the package engine range.

Catalog media generation also uses Python 3 and Pillow (see
`scripts/requirements.txt`). Generated previews are committed, so simply
starting the app does not need Python.

```bash
npm ci
npm run start
```

`npm run web` opens the browser development target. `npm run android` and
`npm run ios` invoke native builds; run those yourself when ready. Native
regeneration commands are `npm run android:prebuild` and, on macOS,
`npm run ios:prebuild`. No native build was run during initial preparation.

The guide has a fixed three-column grid, searchable names and families, a
family-grouped advanced list, configurable principal name, square photo galleries,
single-scroll profiles, a family index with a persistent guide filter, and a phytophysiognomy entry
point. The first habitat card filters the guide; other modules remain drafts.
No vocalizations, microphone integration, maps, billing, or bird packs.

The home grid follows the bird guide: edge-to-edge square tiles, one-pixel
separators and one name over each photo. Configurações → Nome principal selects
Português or Científico, and the choice is saved on the device. Portuguese names
include explicit break opportunities after hyphens. Invasive entries carry a
pink exclamation icon. Family and native/invasive filter rows are not pinned
above the grid; search still finds family names. The Famílias tab opens an alphabetical
index. Selecting a family filters the guide; the × beside its name in the search
field clears the filter. Grid and advanced list share this filter.

## Catalog and editorial scope

`src/data/plants.json` is the source of truth. It includes native species
confirmed by JBRJ structured data as accepted species, native in `BR-RJ`, and
present in the Atlantic Forest domain. This is state-level evidence, not a
municipal checklist. The shortlisted families emphasize Myrtaceae,
Bromeliaceae, Arecaceae, Araceae, and Lecythidaceae (the jequitibá family).

Anthurium and Philodendron may be represented as genus groups. Every accepted
native state member is enumerated, including substrate information; a genus
group is not equivalent to a single species and is not restricted to terrestrial
plants. The unique represented species count, including group members, must
stay at or below 1,500. There is no target to fill 1,500 slots automatically.

The initial five editorial invasive selections are leucena, jiboia, zebrina, jaqueira,
and capim-colonião. They are not a ranked top five. See
[research and limitations](docs/catalog-research.md), especially the unresolved
local naming/evidence issue for jiboia.

Draft descriptions summarize structured facts; they are not complete field
descriptions. Names, diagnostic characters, ecological text, city occurrence,
and photos still require botanical review. The app labels draft content.

## Checks and generation

```bash
npm run check
npm run catalog:generate
npm run catalog:release-check
```

The release check intentionally fails while any record or photo is a draft,
or a record has no photo. Ordinary checks permit honest draft gaps.
`catalog:generate` creates static Metro `require()` entries: the shipped guide
loads its photos locally, with no runtime iNaturalist request.
The grid and small gallery previews use generated 320-pixel WebP thumbnails;
the profile preserves the complete original photo within its square frame.
The generated [catalog report](docs/catalog-status.json) lists photo gaps and
review status. A much larger catalog may need independently configured content
packs; this first draft bundles its seed media.

## CC0 photo workflow

```bash
npm run photos:fetch
# Or fetch a specific entry, matching its catalog ID:
npm run photos:fetch -- --ids euterpe-edulis --per-plant 3
# A particular native member can illustrate a grouped genus:
npm run photos:fetch -- --ids anthurium-spp --taxon-name "Anthurium coriaceum"
npm run catalog:generate
npm run catalog:check
npm run editor:sync
```

The importer reads research-grade, non-captive observations and checks each
photo's own `license_code == cc0`. Default taxon photos are never imported.
It downloads images from iNaturalist hosts only, preserves photo/observation
IDs, creator, source URL, timestamp, raw photo-license evidence, and SHA-256.
Missing CC0 media produces a placeholder, never a license substitution.
Photos can be taken outside Rio if their taxon matches; photo provenance is
independent of the botanical evidence for native membership.

In the editor, visually review each photo and assign Flor, Fruto, Folha,
Casca, Planta inteira, Semente, or Raiz. Automated imports leave markers unset because
an observation-level flowering annotation cannot identify which photo shows
a flower. A research-grade identification does not replace visual review.

## Plant content editor

The independent sibling is `../plantas-rio-content-editor`. It uses the same
validated catalog schema, local IndexedDB persistence, photo editing and
reordering, and JSON round trips. It does not use production Supabase or R2.

```bash
npm run editor:sync
# Inspect an exported file without changing the app:
npm run catalog:import -- /path/to/plantas-rio-2026-10-16.json
# Apply the reviewed export, retaining a local backup:
npm run catalog:import -- /path/to/plantas-rio-2026-10-16.json --apply
```

The importer validates media hashes and compares provenance against archived
CC0 evidence before replacing the catalog. New photos must go through the
verified downloader first. Sync refreshes the editor's seed files; an existing
browser draft is preserved until explicitly importing a newer JSON file.

## Reproduce the botanical draft

`sources/flora` contains timestamped API snapshots. `scripts/seed-selection.json`
is an editorial shortlist, not the production catalog. `sources/seed-rejections.json`
records candidates excluded by the official-data filters.

```bash
npm run flora:fetch
python3 scripts/fetch_genera.py
python3 scripts/generate_seed.py /tmp/new-plant-draft.json
```

The generator refuses to replace an existing output. Review and merge a new
draft deliberately; do not overwrite edited descriptions or photo selections.
JBRJ's genus endpoints can time out; `fetch_genera.py` uses the full Araceae
species index and cached species profiles as a reproducible fallback.

## Separate store product

Proposed Android package and iOS bundle ID:
`br.com.avesdosbrasis.plantasdorio`; version `0.1.0`, native build numbers `1`.
These are independent of the bird identifiers but have not been reserved or
registered with either store. App icon, splash artwork, privacy/support pages,
store listings, signing, and any monetization decision remain launch work.
No production credentials, purchase products, native delivery adapters, or
generated Android/iOS folders were copied.

## Managing observations and photo selection

The local plant editor now imports selected photos directly from an iNaturalist
observation URL or numeric ID. It verifies each photo's CC0 license again at
import, warns when the observation's identification differs from the plant or its
enumerated genus members, then caches the image and rights evidence in this
repository. The canonical app catalog is unchanged until you apply an editor
export. There is no two-photo limit, and each plant can use multiple observations.

The editor's Add, Replace, Use as first, Reorder and Remove actions define which
photos go into the next JSON export. Apply it with the same `catalog:import`
commands above; `--apply` regenerates the local thumbnails and Metro manifests.
Keep the app's assets and sources together when moving the project to another
machine. An exported JSON references those verified files rather than embedding
their bytes.

Native/exotic/invasive classification is editable without a fixed five-invasive
cap. The original seed selection is historical, not a validation limit. Photo
category `Porte` is now `Planta inteira`; old JSON files and local browser drafts
are migrated automatically when loaded.

The mobile profile uses a square swipe gallery with category icons at the lower
left, photo credits and navigation dots/arrows. Name, description and alternate
names are plain sections; sources and genus members expand when needed. Photo
categories appear as icons only; Configurações has their legend. Older saved
custom lists are retained on disk, but their controls are no longer shown.

Identification differences are advisory: they do not block photo selection,
saving, JSON round trips, or app import. The editor shows an amber warning and
the catalog CLI prints a warning. Original iNaturalist names and license evidence
remain unchanged, so botanical synonyms or identification differences can be
reviewed without rewriting photo provenance.
