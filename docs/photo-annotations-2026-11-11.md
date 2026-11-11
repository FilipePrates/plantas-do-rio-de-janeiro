# Photo descriptions and tags — 2026-11-11

All 599 existing local photographs were visually inspected using numbered contact sheets, with full images opened when details were unclear. No observation-level phenology was used to assign photo tags.

- Added 499 missing captions; every photo now has a caption.
- Prepended a visual description to 33 identification cautions, preserving the original caution verbatim.
- Updated tags on 352 photographs. A total of 534 photos changed; every changed annotation remains **draft**, pending human review. The 65 untouched photo approvals remain as they were.
- Preserved existing descriptive captions, plant records, gallery order, media bytes, licenses, attribution, evidence and hashes.

| Tag | Before | After |
| --- | ---: | ---: |
| Flor | 104 | 210 |
| Fruto | 53 | 115 |
| Folha | 78 | 207 |
| Casca | 9 | 21 |
| Planta inteira | 105 | 173 |
| Semente | 0 | 5 |
| Raiz | 2 | 8 |
| A conferir / unknown | 324 | 9 |

Tags may overlap within one photograph. Seeds are tagged only where exposed; hidden seeds inside closed fruits were not inferred. Cactus stems were not tagged as leaves. Persistent bromeliad bracts alone were not treated as proof of flowering or fruiting.

Nine photographs retain `unknown`: eight unclear reproductive/target views and one *Rhizophora mangle* propagule, for which the available organ tags do not describe the main subject precisely. The JSON report lists their photo IDs and captions.

Additional checks for the editor:

- *Ocotea puberula*, photo 354855356: swollen structures are described as possible galls and the fruit tag was removed; this remains a tentative interpretation.
- *Psychotria subspathacea*, photo 691168057: the purple structure is described without assigning flower/fruit stage; the identification caution remains.
- Existing *Spondias venulosa* / iNaturalist *S. mombin* name differences on photos 625050388 and 210428107 remain explicit. This pass does not resolve their identification.

The possible-gall interpretation was checked against [Embrapa's description of normal *Ocotea puberula* fruits](https://ainfo.cnptia.embrapa.br/digital/bitstream/item/106964/1/DescricaoDendrologica0001.pdf) and [primary research on this species' galls](https://rsdjournal.org/rsd/article/view/15934). These support retaining uncertainty, rather than confirming a particular gall type. The closed *Bactris setosa* reproductive bract was also compared with the [UFSC Horto description](https://hortodidatico.ufsc.br/tucum/).

Full before/after values are in [the CSV](photo-annotations-2026-11-11.csv). The immutable starting catalog, individual visual notes and change audit are in [`sources/photo-annotations-2026-11-11`](../sources/photo-annotations-2026-11-11).

The plant editor's seed has been synchronized. On a browser that already has a saved local catalog, first export any edits you want to preserve, then use **Importar JSON** and select `plantas-do-rio-de-janeiro/src/data/plants.json`. Import replaces the browser catalog after its confirmation prompt; refreshing alone retains the existing browser copy.

Validation: app and editor TypeScript checks; 42 app tests; 9 editor tests; catalog validation and editor seed equality. All 599 original and thumbnail hashes are checked by catalog validation. No APK was rebuilt for this annotation pass; the previously archived APK predates these captions and tags.
