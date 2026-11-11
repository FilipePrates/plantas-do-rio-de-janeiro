"""Produce a compact review report and photo-level CSV from the curation audit."""
import csv
import json
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'sources/cactaceae-2026-11-11'
audit=json.loads((OUT/'audit.json').read_text(encoding='utf8'))
catalog=json.loads((ROOT/'src/data/plants.json').read_text(encoding='utf8'))
new=[p for p in catalog['plants'] if p['id'] in audit['addedPlantIds']]
summary=dict(date=audit['date'],newProfiles=len(new),expandedProfiles=len(audit['updatedProfiles']),
             cactusProfiles=sum(p['family']=='Cactaceae' for p in catalog['plants']),newPhotos=len(audit['newPhotos']),
             newPhotoLicenses=dict(Counter(p['licenseCode'] for p in audit['newPhotos'])),
             addedOriginalBytes=audit['originalMediaBytesAdded'],addedOriginalMiB=round(audit['originalMediaBytesAdded']/1024**2,2),
             entries=len(catalog['plants']),representedSpecies=508,photos=sum(len(p['photos']) for p in catalog['plants']),
             catalogSha256=audit['catalogSha256'],humanReview='All new/changed content remains draft.',
             species=[dict(id=p['id'],scientificName=p['scientificName'],commonName=p['commonName'],photos=len(p['photos'])) for p in new])
(ROOT/'docs/cactaceae-2026-11-11.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
with (ROOT/'docs/cactaceae-2026-11-11.csv').open('w',encoding='utf-8-sig',newline='') as handle:
    writer=csv.writer(handle)
    writer.writerow(['scientificName','photoId','licenseCode','caption','markers','bytes','reviewStatus'])
    for p in audit['newPhotos']: writer.writerow([p['scientificName'],p['photoId'],p['licenseCode'],p['caption'],','.join(p['markers']),p['bytes'],'draft'])
lines=['# Cactaceae — 11/11/2026','',
       'Added **14 illustrated profiles**, expanded the **3 existing cactus profiles**, and imported **33 photographs**: 24 CC0 and 9 CC BY 4.0. Original media added: **18.18 MiB**, plus small offline thumbnails. The family now has **17 species profiles**. The complete catalog has 387 entries, 508 represented species and 633 photographs.','',
       'Every new photograph has an individually written caption and visual tagging record. Two close views show only stems or wool (Brasiliopuntia 246576758; Pilosocereus ulei 566555783), so they retain `unknown` because the current organ categories have no stem tag. Cactus stem segments were never tagged as leaves. The four new leaf-tagged views belong to the genuinely leafy Pereskia species.','',
       '| New species | Display name | Photos |','| --- | --- | ---: |']
for p in new: lines.append(f'| *{p["scientificName"]}* | {p["commonName"]} | {len(p["photos"])} |')
lines += ['',
    'Expanded existing profiles: *Cereus fernambucensis*, *Epiphyllum phyllanthus* and *Rhipsalis teres*. New text covers diagnostic characters, comparisons, reproductive structures and ecology. The prior descriptions and approvals are archived in the change audit; changed text returns to draft. Every prior photo, caption, marker, credit, license, source hash and gallery order remains exact. All non-cactus records are unchanged.','',
    '## Botanical decisions','',
    '- Current Flora e Funga names are used. *Pereskia grandifolia* retains *Rhodocactus grandifolius* as a searchable alternative.','- *Hatiora salicornioides* follows Flora e Funga; iNaturalist and POWO use *H. salicornoides*. The spelling difference is explicit and each photo keeps its original observation identification.','- *Rhipsalis paradoxa* uses the regional treatment for its winged segments; a conflicting WFO summary is documented in curation notes.','- *Cereus sericifer* is accepted separately in the current Flora service but retained as a subspecies of *C. fernambucensis* by other treatments. No unsupported second illustrated profile was made from the same concept.','- *Cereus hildmannianus* was deferred because the regional revision questions the historical voucher. *Schlumbergera russelliana* was deferred because the only eligible observation provided weak views of the flowers. These decisions do not modify the supplied workbook.','',
    '## Sources and provenance','',
    'Each profile links its exact Flora e Funga record and a morphology source. Main treatments include [Flora do Rio de Janeiro: Cactaceae (2020)](https://www.scielo.br/j/rod/a/MNrS9zS6HNxwLG9JKt9kTqG/?lang=pt), [Cactaceae in Serra da Tiririca (2019)](https://www.scielo.br/j/rod/a/SW9jGPTsmNXbcFkxxBGng8B/?lang=pt), the São Paulo state flora, the INSA cactus collection account, and species-level Brazilian Flora descriptions in World Flora Online. Descriptions are original Portuguese summaries, with exact source links in each profile.','',
    'The supplied workbook remains the state authority for listed species; additional epiphytic/restinga species have state-level records in their cached Flora records and regional treatments. No municipal scope was inferred from photographs. Foreign photographs illustrate morphology and do not establish a Rio locality. No food, medicinal or cultivation recommendation was inferred.','',
    'Full public API survey records, numbered selection records, visual notes, starting catalog and before/after audit: [`sources/cactaceae-2026-11-11`](../sources/cactaceae-2026-11-11). Individual acquisition evidence remains under `sources/inaturalist/photos`. [Photo CSV](cactaceae-2026-11-11.csv).','',
    '## Editor and review','',
    'The plant editor seed and local images have been synchronized. Existing browser drafts are preserved. If the browser already has saved work, export it before replacing its catalog via **Importar JSON**; the updated seed is `plantas-rio-content-editor/public/catalog.json`. Saving in the browser does not write the canonical app catalog; export and use the validated app import workflow when ready.','',
    'All new profiles, photos and changed text remain draft for human review. No APK was rebuilt for this content pass.','']
(ROOT/'docs/cactaceae-2026-11-11.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({k:v for k,v in summary.items() if k!='species'},ensure_ascii=False,indent=2))
