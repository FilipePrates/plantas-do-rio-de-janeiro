"""Dated, offline summary of the requested family expansion and its evidence."""
import csv,hashlib,json
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'sources/family-gaps-2026-11-11'
def read(path):return json.loads(path.read_text(encoding='utf8'))
catalog=read(ROOT/'src/data/plants.json');before=read(OUT/'catalog-before.json');audit=read(OUT/'audit.json')
assert hashlib.sha256((ROOT/'src/data/plants.json').read_bytes()).hexdigest()==audit['catalogSha256']
new=[p for p in catalog['plants'] if p['id'] in audit['addedPlantIds']]
species={member['scientificName'] for plant in catalog['plants'] for member in (plant['regionalSpecies'] if plant['rank']=='genus' else [plant])}
families=[]
for family in ['Nyctaginaceae','Euphorbiaceae','Sapindaceae','Rutaceae','Orchidaceae']:
    count=lambda data:sum(p['family']==family and bool(p['photos']) and p.get('presentation','profile')=='profile' for p in data['plants'])
    families.append(dict(family=family,illustratedProfilesBefore=count(before),illustratedProfilesAfter=count(catalog)))
summary=dict(date=audit['date'],newProfiles=len(new),newOrchids=sum(p['family']=='Orchidaceae' for p in new),
             expandedProfiles=len(audit['updatedProfiles']),newPhotos=len(audit['newPhotos']),
             newPhotoLicenses=dict(Counter(row['licenseCode'] for row in audit['newPhotos'])),
             addedOriginalMiB=round(audit['originalMediaBytesAdded']/1024**2,2),
             entries=len(catalog['plants']),representedSpecies=len(species),photos=sum(len(p['photos']) for p in catalog['plants']),
             catalogSha256=audit['catalogSha256'],families=families,
             species=[dict(scientificName=p['scientificName'],family=p['family'],photos=len(p['photos'])) for p in new])
(ROOT/'docs/family-gaps-2026-11-11.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
with (ROOT/'docs/family-gaps-2026-11-11-photos.csv').open('w',encoding='utf-8-sig',newline='') as handle:
    writer=csv.writer(handle);writer.writerow(['scientificName','photoId','licenseCode','caption','markers','bytes','reviewStatus'])
    for row in audit['newPhotos']:writer.writerow([row['scientificName'],row['photoId'],row['licenseCode'],row['caption'],','.join(row['markers']),row['bytes'],'draft'])
lines=['# Requested family gaps and orchids — 11/11/2026','',
       '**16 new illustrated profiles: eight trees/shrubs and eight orchids.** The existing illustrated reference for **Cattleya guttata** now has complete description, identification and ecology and is presented as a profile. **36 new photos** have individual captions and visible-organ tags: **18 CC0 and 18 CC BY 4.0**. Original media adds **16.22 MiB**, plus generated small previews.','',
       f'The catalog now has **{len(catalog["plants"])} entries, {len(species)} represented species and {summary["photos"]} photos**. This batch follows the [mangrove/Begonia/priority-tree expansion](begonia-mangrove-2026-11-11.md); all of that content is retained.','',
       '| Species | Family | Photos |','| --- | --- | ---: |']
for p in new:lines.append(f'| *{p["scientificName"]}* | {p["family"]} | {len(p["photos"])} |')
lines+=['','| Family | Illustrated profiles before | Illustrated profiles now |','| --- | ---: | ---: |']
for row in families:lines.append(f'| {row["family"]} | {row["illustratedProfilesBefore"]} | {row["illustratedProfilesAfter"]} |')
lines+=['','## Selection and botanical decisions','',
        '- The supplied tree/shrub workbook remains the state scope authority for its species. The orchid additions have exact accepted Flora e Funga records with native RJ distributions. All newly added profiles retain `rio-state`; photo localities are not municipal occurrence evidence.',
        '- *Maxillaria picta* is accepted in the queried Flora e Funga record and [POWO/Kew](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:30156984-2). *Brasiliorchis picta* is retained as a searchable synonym, without a duplicate entry. *Gomesa flexuosa* also includes the older name *Oncidium flexuosum*.',
        '- *Cattleya lobata* was deferred because the archived survey returned no eligible photo observations. *C. warneri* and *Eulophia alta* are not supplied workbook trees/shrubs, and their specific Flora responses did not confirm native RJ records; they were not silently added as state natives.',
        '- Orchid photographs were compared with species morphology. The selected *Miltonia spectabilis* photos are Rio/Tinguá records with the broad, pale/pink lip; a narrower-lipped foreign candidate was not selected. No hybrid was intentionally substituted for a wild species.',
        '- Guapira descriptions explain antocarps and compare leaf insertion. Alchornea comparisons use petiole shape and venation, not simply the presence of three basal veins. Orchid descriptions distinguish leaves, pseudobulbs, flower parts and inflorescences. *Sacoila lanceolata* photos do not mislabel neighboring grass as orchid foliage.',
        '- All 685 earlier photographs retain exact bytes, rights, captions, tags, review states and gallery positions. Only the enumerated text/presentation fields of *Cattleya guttata* changed. New text and annotations remain draft for human review.',
        '', 'Each profile links an exact Flora record and a species morphology source. Sources include Embrapa, USP/ESALQ, Smithsonian Gardens, Brazilian taxonomic treatments in WFO, and specific research papers. Broad habitat lists are not interpreted as presence in every Rio habitat. No medicinal or food-use recommendation was added.',
        '', '## Evidence, editor and APK','',
        'Starting catalog, full public API responses, shortlist, visual notes and exact before/after audit are under [`sources/family-gaps-2026-11-11`](../sources/family-gaps-2026-11-11). [Photo audit CSV](family-gaps-2026-11-11-photos.csv). The independent editor seed/schema/images are synchronized; existing IndexedDB drafts are not replaced. Export any browser edits before intentionally importing a refreshed catalog.',
        '', 'The superseded APK build was stopped at the user’s request. The final test APK is built only after this content pass and its validation; artifact verification checks every original image/thumbnail hash, every current photo caption, all current profile text, the loading-indicator string, package identity and signature. Device runtime behavior is a separate check.', '']
(ROOT/'docs/family-gaps-2026-11-11.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({k:v for k,v in summary.items() if k not in ['species','families']},ensure_ascii=False,indent=2))
