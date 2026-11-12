"""Offline coverage report: workbook scope, illustrated profiles and photo audit."""
import csv
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from prepare_scope import read_workbook
OUT=ROOT/'sources/begonia-mangrove-2026-11-11'
def read(path):return json.loads(path.read_text(encoding='utf8'))
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
catalog=read(ROOT/'src/data/plants.json');before=read(OUT/'catalog-before.json');audit=read(OUT/'audit.json')
assert hashlib.sha256((ROOT/'src/data/plants.json').read_bytes()).hexdigest()==audit['catalogSha256']
workbook=read_workbook(ROOT/'docs/Arvores_Arbustos_Nativos_RJ.xlsx')
names={m['scientificName'] for p in catalog['plants'] for m in (p['regionalSpecies'] if p['rank']=='genus' else [p])}
new=[p for p in catalog['plants'] if p['id'] in audit['addedPlantIds']]
test=(ROOT/'tests/priority-batch.test.mjs').read_text(encoding='utf8')
priority=re.findall('"([A-Z][a-z]+ [a-z]+)"',test[test.index('const priority'):test.index('test(')])
checklist=[]
for name in priority:
    plant=next(p for p in catalog['plants'] if p['scientificName']==name)
    previous=next((p for p in before['plants'] if p['scientificName']==name),None)
    action='new profile' if previous is None else ('completed/expanded' if any(c['plantId']==plant['id'] for c in audit['updatedProfiles']) else 'existing profile retained')
    assert plant['photos'] and plant['identification'] and plant['ecology'] and plant.get('presentation','profile')=='profile'
    checklist.append(dict(scientificName=name,commonName=plant['commonName'],photos=len(plant['photos']),action=action))
family_counts=[]
for family in sorted(set(p['family'] for p in catalog['plants'])|set(row['family'] for row in workbook)):
    plants=[p for p in catalog['plants'] if p['family']==family];rows=[r for r in workbook if r['family']==family]
    family_counts.append(dict(family=family,entries=len(plants),illustratedProfiles=sum(bool(p['photos']) and p.get('presentation','profile')=='profile' for p in plants),
                              illustratedReferences=sum(bool(p['photos']) and p.get('presentation')=='checklist' for p in plants),
                              workbookSpecies=len(rows),workbookUnrepresented=sum(row['species'] not in names for row in rows)))
candidates={
 'Nyctaginaceae':['Guapira opposita','Guapira pernambucensis'],
 'Euphorbiaceae':['Alchornea triplinervia','Croton floribundus'],
 'Sapindaceae':['Allophylus edulis','Sapindus saponaria'],
 'Rutaceae':['Zanthoxylum rhoifolium','Esenbeckia leiocarpa'],
 'Piperaceae':['Piper cernuum','Piper amalago'],
 'Erythroxylaceae':['Erythroxylum ovalifolium','Erythroxylum pulchrum'],
 'Ochnaceae':['Ouratea cuspidata','Ouratea multiflora'],
 'Polygonaceae':['Coccoloba arborescens','Coccoloba ochreolata'],
 'Asteraceae':['Baccharis dracunculifolia','Vernonanthura polyanthes'],
 'Solanaceae':['Solanum paniculatum','Solanum mauritianum'],
 'Rubiaceae':['Bathysa australis','Psychotria nuda'],
 'Sapotaceae':['Pouteria venosa','Pouteria torta'],
 'Myrtaceae':['Plinia edulis','Campomanesia phaea'],
 'Cannabaceae':['Trema micranthum'],
}
backlog=[]
for family,species in candidates.items():
    for name in species:
        row=next((row for row in workbook if row['species']==name),None)
        if not row:continue
        plant=next((p for p in catalog['plants'] if p['scientificName']==name or any(m['scientificName']==name for m in p['regionalSpecies'])),None)
        if plant and plant.get('presentation','profile')=='profile' and plant['rank']=='species' and plant['photos']:continue
        backlog.append(dict(family=family,scientificName=name,workbookRow=row['workbookRow'],
                            current='reference only' if plant and plant.get('presentation')=='checklist' else ('genus member' if plant else 'absent'),
                            nextAction='Survey eligible, visually diagnostic photos; then write a sourced profile.'))
thumb_bytes=sum((ROOT/'assets/plants/thumbs'/('inat-'+str(row['photoId'])+'.webp')).stat().st_size for row in audit['newPhotos'] if (ROOT/'assets/plants/thumbs'/('inat-'+str(row['photoId'])+'.webp')).exists())
summary=dict(date=audit['date'],newProfiles=len(new),expandedProfiles=len(audit['updatedProfiles']),newBegoniaceae=sum(p['family']=='Begoniaceae' for p in new),
             newPhotos=len(audit['newPhotos']),newPhotoLicenses=dict(Counter(p['licenseCode'] for p in audit['newPhotos'])),
             correctedExistingCaptions=len(audit['photoAnnotationCorrections']),addedOriginalMiB=round(audit['originalMediaBytesAdded']/1024**2,2),
             entries=len(catalog['plants']),representedSpecies=len(names),photos=sum(len(p['photos']) for p in catalog['plants']),
             illustratedProfiles=sum(bool(p['photos']) and p.get('presentation','profile')=='profile' for p in catalog['plants']),
             workbookSpecies=len(workbook),workbookUnrepresented=sum(row['species'] not in names for row in workbook),
             catalogSha256=audit['catalogSha256'],priorityChecklist=checklist,families=family_counts,nextCandidates=backlog,
             species=[dict(scientificName=p['scientificName'],commonName=p['commonName'],family=p['family'],photos=len(p['photos'])) for p in new])
write(ROOT/'docs/begonia-mangrove-2026-11-11.json',summary)
with (ROOT/'docs/begonia-mangrove-2026-11-11-photos.csv').open('w',encoding='utf-8-sig',newline='') as handle:
    writer=csv.writer(handle);writer.writerow(['scientificName','photoId','licenseCode','caption','markers','bytes','reviewStatus'])
    for row in audit['newPhotos']:writer.writerow([row['scientificName'],row['photoId'],row['licenseCode'],row['caption'],','.join(row['markers']),row['bytes'],'draft'])
with (ROOT/'docs/next-batch-candidates-2026-11-11.csv').open('w',encoding='utf-8-sig',newline='') as handle:
    writer=csv.DictWriter(handle,fieldnames=['family','scientificName','workbookRow','current','nextAction']);writer.writeheader();writer.writerows(backlog)
lines=['# Mangroves, Begoniaceae and priority trees — 11/11/2026','',
       '**26 new illustrated species profiles**, **12 existing profiles completed/expanded**, **52 new photographs** (28 CC0, 24 CC BY 4.0). Original images add **22.58 MiB**, plus small generated previews. The catalog now has **413 entries, 534 represented species and 685 photos**. All 52 new photos have individual descriptions and visible-organ tags.','',
       'The supplied workbook contains **3,114 species**. It is the state authority for listed trees/shrubs; its absence of orchids, ferns or herbaceous plants does not mean those groups are absent from Rio. No repeated state-occurrence check was used as a barrier to including workbook species. The limiting steps are good diagnostic photos, photo-level license evidence and sourced identification content. Size is managed by selecting complementary views rather than importing entire observation galleries.','',
       '## Mangrove coverage','',
       '| Name | Species | Result |','| --- | --- | --- |',
       '| Mangue-vermelho | *Rhizophora mangle* | Existing illustrated profile expanded; arched roots and propagules explained. |',
       '| Mangue-branco | *Laguncularia racemosa* | Existing illustrated profile expanded; opposite leaves and paired petiole glands. |',
       '| Mangue-preto | *Avicennia schaueriana* | Existing illustrated profile expanded; leaves, pneumatophores and comparison. |',
       '| Mangue-preto / siriúba | *Avicennia germinans* | New profile and 3 photos; northern Rio / Paraíba do Sul context. |',
       '| Mangue-de-botão (associated coastal vegetation) | *Conocarpus erectus* | Existing illustrated profile expanded; alternate leaves and clustered fruits. |','',
       'The [INEA state atlas](https://www.inea.rj.gov.br/wp-content/uploads/2022/12/Atlas-das-UCs-estaduais-RJ.pdf) documents the two Avicennia species in the state. The profiles avoid imposing a fixed sequence of vegetation zones on every estuary. The number of mangrove species throughout Brazil was not substituted for Rio coverage.','',
       '## Begoniaceae and other new profiles','',
       'Eleven individual Begonia profiles replace the previous absence of this family. Palmatissect leaves of B. luxurians are explained as one deeply divided blade; fern sori are never tagged as flowers, fruits or seeds. Winged Begonia ovaries are distinguished from mature capsules.','',
       '| New species | Family | Photos |','| --- | --- | ---: |']
for plant in new:lines.append(f'| *{plant["scientificName"]}* | {plant["family"]} | {len(plant["photos"])} |')
lines+=['','Begonia maculata photos were selected from Rio observations and compared with the species treatment, which warns about ornamental hybrids. [Moonlight & Lima (2025)](https://journals.rbge.org.uk/ejb/article/view/2055) place B. luxurians under B. verticillata and B. solananthera under B. radicans. Names from the cached Flora e Funga are retained consistently, with explicit notes and searchable alternatives; photo identifications stay exactly as acquired.','',
        'Begonia acetosa was deferred because the structured taxonomic response was inconclusive; B. aconitifolia had no eligible observations in the archived exact-name survey. One good photo was retained for Andira legalis, B. arborescens and B. reniformis rather than padding their galleries with duplicates. Missing flower/fruit views are stated where relevant.','',
        '## All 30 requested species','',
        'All 30 now have individual illustrated profiles with description, identification and ecology. Before this pass, 20 were presented as profiles, two were illustrated reference entries, and eight were absent. Six of the older profiles still had empty identification sections; those are now completed too.','',
        '| Species | Display name | Photos | Action |','| --- | --- | ---: | --- |']
for row in checklist:lines.append(f'| *{row["scientificName"]}* | {row["commonName"]} | {row["photos"]} | {row["action"]} |')
lines+=['','## Next important gaps','',
        'These are priorities for the next photo survey, not a claim that every workbook species needs an app page. Counts below are **individual/group profiles with photos**; illustrated reference entries are counted separately in the JSON report. Family sizes in the workbook cover its tree/shrub scope, not all Rio flora.','',
        '| Family | Illustrated profiles now | Workbook tree/shrub species | Useful next genera/species to survey |','| --- | ---: | ---: | --- |']
for family in ['Nyctaginaceae','Euphorbiaceae','Sapindaceae','Rutaceae','Piperaceae','Erythroxylaceae','Ochnaceae','Polygonaceae','Asteraceae','Solanaceae','Rubiaceae','Sapotaceae','Myrtaceae','Cannabaceae']:
    row=next(r for r in family_counts if r['family']==family)
    species=[r['scientificName'] for r in backlog if r['family']==family]
    lines.append(f'| {family} | {row["illustratedProfiles"]} | {row["workbookSpecies"]} | '+', '.join('*'+name+'*' for name in species)+' |')
orchids=next(row for row in family_counts if row['family']=='Orchidaceae')
lines+=['',f'Orchidaceae remains a major herb/epiphyte gap: {orchids["illustratedProfiles"]} illustrated profiles, plus {orchids["illustratedReferences"]} illustrated reference entry. It needs a separate Rio orchid shortlist; this tree/shrub workbook cannot supply a statewide orchid denominator. More Peperomia, ferns, Cyperaceae, Acanthaceae and forest herbs would also improve field coverage beyond trees.',
        '',f'Exact-name workbook coverage leaves {summary["workbookUnrepresented"]} names unrepresented. This is a reproducible spelling-based comparison, not an estimate of accepted statewide flora: synonyms and the workbook date can change that number. [Candidate CSV](next-batch-candidates-2026-11-11.csv) records row numbers and whether each candidate is absent, reference-only or still inside a genus group.',
        '','## Preservation, editor and verification','',
        'All 633 previous photo files, hashes, rights, tags and gallery positions are preserved. Two existing grumixama captions were corrected after reinspection: persistent sepals are opposite the pedicel, not beside it. Only those captions and their draft states changed; the exact before/after record is in the audit. Existing municipal evidence and historical conservation records retain their dates and scope. No threat status, edibility or medicinal advice was inferred.',
        '', 'All newly written/changed text and new photo annotations remain **draft** for human review. Sources are attached per species. Public API surveys, selected photo records, visual notes and the starting catalog are under [`sources/begonia-mangrove-2026-11-11`](../sources/begonia-mangrove-2026-11-11). [New-photo CSV](begonia-mangrove-2026-11-11-photos.csv).',
        '', 'The independent editor seed, schema and image cache were synchronized. Start it with `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\\Users\\Samsung\\aves-do-brasil\\plantas-rio-content-editor\\start-editor.ps1"`, then open http://127.0.0.1:5174. If a browser draft already exists, export it before intentionally importing the new `public/catalog.json`; seed sync preserves existing IndexedDB edits.',
        '', 'Guide search now prepares normalized catalog text once, keeps typing responsive with deferred result rendering, and shows a small accessible ActivityIndicator while the displayed result query catches up. Search semantics retain accent handling, aliases, enumerated genus members and conservation-unit names. Browser checks use an isolated mobile-size Chrome context with 6× CPU throttling; they do not replace Android device timing.',
        '', 'Validation: app/editor typechecks, **51 app tests + 9 editor tests passed**, catalog media/evidence validation and isolated search interaction checks. The browser confirmed all 11 new Begonia results, the new black-mangrove result, accent search, rapid query replacement, empty/clear states, indicator appearance and the three-column mobile grid with no page errors. App/editor catalog bytes match exactly. All 633 previous original-media hashes were rechecked. The 52 generated previews add 1,067,998 bytes alongside the 22.58 MiB of original images. No APK, prebuild or native release was run for this pass.', '']
(ROOT/'docs/begonia-mangrove-2026-11-11.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({k:v for k,v in summary.items() if k not in ['priorityChecklist','families','nextCandidates','species']},ensure_ascii=False,indent=2))
