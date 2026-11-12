# Requested family gaps and orchids — 11/11/2026

**16 new illustrated profiles: eight trees/shrubs and eight orchids.** The existing illustrated reference for **Cattleya guttata** now has complete description, identification and ecology and is presented as a profile. **36 new photos** have individual captions and visible-organ tags: **18 CC0 and 18 CC BY 4.0**. Original media adds **16.22 MiB**, plus generated small previews.

The catalog now has **429 entries, 550 represented species and 721 photos**. This batch follows the [mangrove/Begonia/priority-tree expansion](begonia-mangrove-2026-11-11.md); all of that content is retained.

| Species | Family | Photos |
| --- | --- | ---: |
| *Guapira opposita* | Nyctaginaceae | 2 |
| *Guapira pernambucensis* | Nyctaginaceae | 2 |
| *Alchornea triplinervia* | Euphorbiaceae | 2 |
| *Alchornea glandulosa* | Euphorbiaceae | 3 |
| *Croton floribundus* | Euphorbiaceae | 2 |
| *Allophylus edulis* | Sapindaceae | 2 |
| *Sapindus saponaria* | Sapindaceae | 3 |
| *Zanthoxylum rhoifolium* | Rutaceae | 2 |
| *Cattleya forbesii* | Orchidaceae | 2 |
| *Brassavola tuberculata* | Orchidaceae | 2 |
| *Encyclia patens* | Orchidaceae | 2 |
| *Miltonia spectabilis* | Orchidaceae | 2 |
| *Gomesa flexuosa* | Orchidaceae | 3 |
| *Sacoila lanceolata* | Orchidaceae | 3 |
| *Vanilla chamissonis* | Orchidaceae | 2 |
| *Maxillaria picta* | Orchidaceae | 2 |

| Family | Illustrated profiles before | Illustrated profiles now |
| --- | ---: | ---: |
| Nyctaginaceae | 0 | 2 |
| Euphorbiaceae | 0 | 3 |
| Sapindaceae | 0 | 2 |
| Rutaceae | 0 | 1 |
| Orchidaceae | 3 | 12 |

## Selection and botanical decisions

- The supplied tree/shrub workbook remains the state scope authority for its species. The orchid additions have exact accepted Flora e Funga records with native RJ distributions. All newly added profiles retain `rio-state`; photo localities are not municipal occurrence evidence.
- *Maxillaria picta* is accepted in the queried Flora e Funga record and [POWO/Kew](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:30156984-2). *Brasiliorchis picta* is retained as a searchable synonym, without a duplicate entry. *Gomesa flexuosa* also includes the older name *Oncidium flexuosum*.
- *Cattleya lobata* was deferred because the archived survey returned no eligible photo observations. *C. warneri* and *Eulophia alta* are not supplied workbook trees/shrubs, and their specific Flora responses did not confirm native RJ records; they were not silently added as state natives.
- Orchid photographs were compared with species morphology. The selected *Miltonia spectabilis* photos are Rio/Tinguá records with the broad, pale/pink lip; a narrower-lipped foreign candidate was not selected. No hybrid was intentionally substituted for a wild species.
- Guapira descriptions explain antocarps and compare leaf insertion. Alchornea comparisons use petiole shape and venation, not simply the presence of three basal veins. Orchid descriptions distinguish leaves, pseudobulbs, flower parts and inflorescences. *Sacoila lanceolata* photos do not mislabel neighboring grass as orchid foliage.
- All 685 earlier photographs retain exact bytes, rights, captions, tags, review states and gallery positions. Only the enumerated text/presentation fields of *Cattleya guttata* changed. New text and annotations remain draft for human review.

Each profile links an exact Flora record and a species morphology source. Sources include Embrapa, USP/ESALQ, Smithsonian Gardens, Brazilian taxonomic treatments in WFO, and specific research papers. Broad habitat lists are not interpreted as presence in every Rio habitat. No medicinal or food-use recommendation was added.

## Evidence, editor and APK

Starting catalog, full public API responses, shortlist, visual notes and exact before/after audit are under [`sources/family-gaps-2026-11-11`](../sources/family-gaps-2026-11-11). [Photo audit CSV](family-gaps-2026-11-11-photos.csv). The independent editor seed/schema/images are synchronized; existing IndexedDB drafts are not replaced. Export any browser edits before intentionally importing a refreshed catalog.

The superseded APK build was stopped at the user’s request. The final test APK is built only after this content pass and its validation; artifact verification checks every original image/thumbnail hash, every current photo caption, all current profile text, the loading-indicator string, package identity and signature. Device runtime behavior is a separate check.

Final validation passed: **54 app tests and 9 editor tests**, both typechecks and catalog validation. The [new test APK](../dist/plantas-rio-2026-11-11-familias-orquideas-teste.apk) contains all **721 original photos, 721 previews, 721 current captions and 1,055 current profile strings**, verified against the canonical catalog. The search loading-indicator text is also present. Build size: **421,821,056 bytes (402.28 MiB)**. SHA-256: `1db8f1b523e53d5ae6f341aea92297d9786b268bdb52101c61d976d1c853c728`. Android package: `br.com.avesdosbrasis.plantasdorio`; ARM64 and ARMv7. [Artifact verification](../dist/plantas-rio-2026-11-11-familias-orquideas-teste.verification.json). Physical-device runtime testing remains for the user’s test.
