"""Apply one bounded, visually annotated cactus pass; preserve prior media/edits."""
import copy
import hashlib
import json
import re
import sys
import time
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from cactaceae_texts import NEW, UPDATES, FLORA_RIO, FIRST_PHOTO

OUT=ROOT/'sources/cactaceae-2026-11-11'
CATALOG=ROOT/'src/data/plants.json'
FIELDS=['description','identification','ecology','sources','reviewStatus','curationNotes']
def read(path): return json.loads(path.read_text(encoding='utf8'))
def write(path,value): path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def source(title,url): return dict(title=title,url=url,retrievedAt='2026-11-11')

catalog=read(CATALOG)
assert not (OUT/'audit.json').exists(), 'Pass already applied; preserve subsequent edits.'
assert not (OUT/'catalog-before.json').exists(), 'Existing baseline: merge explicitly.'
before=copy.deepcopy(catalog)
write(OUT/'catalog-before.json',before)
shortlist=read(OUT/'shortlist.json')
notes={}
for line in (OUT/'photo-notes.txt').read_text(encoding='utf8').splitlines():
    if not line.strip() or line.startswith('#'): continue
    number,markers,caption=line.split('|',2)
    assert int(number) not in notes
    notes[int(number)]=dict(markers=markers.split(','),caption=caption)
assert set(notes)=={r['number'] for r in shortlist}
assert sum((ROOT/'backups/cactaceae-2026-11-11/full'/r['stagedFileName']).stat().st_size for r in shortlist)<25*1024*1024
old_names={m['scientificName'] for p in before['plants'] for m in (p['regionalSpecies'] if p['rank']=='genus' else [p])}
assert not old_names.intersection(NEW)
assert {r['scientificName'] for r in shortlist}==set(NEW)
now=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
added=[];changes=[];media=[]

for plant in catalog['plants']:
    text=UPDATES.get(plant['scientificName'])
    if not text: continue
    original=copy.deepcopy(plant)
    for field in ['description','identification','ecology']: plant[field]=text[field]
    for item in [source('Revisão morfológica específica consultada em 11/11/2026.',text['morphologySource']),
                 source('Freitas, Calvente & Gonzaga (2020). Flora do Rio de Janeiro: Cactaceae.',FLORA_RIO)]:
        if not any(s['url']==item['url'] for s in plant['sources']): plant['sources'].append(item)
    plant['reviewStatus']='draft'
    plant['curationNotes']=plant.get('curationNotes','')+' Revisão de Cactaceae de 11/11/2026: descrição, identificação e ecologia ampliadas com fontes específicas; todos os metadados e bytes das fotografias anteriores preservados. Texto alterado em rascunho para nova revisão humana.'
    changes.append(dict(plantId=plant['id'],before={k:original.get(k) for k in FIELDS},after={k:plant.get(k) for k in FIELDS}))

for name,text in NEW.items():
    payload=read(ROOT/'sources/flora'/(name.replace(' ','_')+'.json'))
    record=next(r for r in payload['data'] if r['taxon']['taxonrank']=='ESPECIE' and r['taxon']['genus']+' '+r['taxon']['specificepithet']==name)
    assert record['taxon']['taxonomicstatus']=='NOME_ACEITO'
    plant=dict(id=name.lower().replace(' ','-'),scientificName=name,authorship=record['taxon']['scientificnameauthorship'],
               commonName=text['commonName'],alternateNames=text['alternateNames'],family='Cactaceae',genus=record['taxon']['genus'],
               rank='species',origin='native',geography='rio-state',presentation='profile',reviewStatus='draft',
               description=text['description'],identification=text['identification'],ecology=text['ecology'],
               lifeForms=record['specie_profile']['lifeForm'],substrates=record['specie_profile']['habitat'],
               habitats=record['specie_profile']['vegetationType'],floraId=record['taxon']['taxonid'],regionalSpecies=[],photos=[],
               sources=[source('Flora e Funga do Brasil — '+name+': nome, forma de vida e ambientes.',payload['url']),
                        source('Descrição morfológica específica de '+name+'.',text['morphologySource'])],
               curationNotes='Seleção de Cactaceae de 11/11/2026. Fotografias escolhidas por inspeção visual e direitos individuais CC0/CC BY, sem inferir órgãos a partir de anotações da observação. Ficha estadual; fotos externas ao Rio ilustram a espécie e não comprovam ocorrência municipal. Perfis e novas anotações permanecem em rascunho.')
    if name=='Hatiora salicornioides':
        plant['sources'].append(source('POWO/Kew — grafia Hatiora salicornoides.', 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:118071-2'))
        plant['curationNotes']+=' Flora e Funga usa salicornioides; iNaturalist e POWO usam salicornoides. O nome original das fotos foi mantido. Não se trata de duas espécies.'
    if name=='Rhipsalis paradoxa':
        plant['curationNotes']+=' Morfologia das alas baseada no tratamento específico da Serra da Tiririca (2019); o resumo WFO apresenta contagem de costelas divergente e não foi usado para esse caráter.'
    if name=='Pereskia grandifolia':
        plant['curationNotes']+=' Nome mantido conforme Flora e Funga; Rhodocactus grandifolius preservado como nome alternativo de busca.'
    for row in [r for r in shortlist if r['scientificName']==name]:
        ph=row['photo'];taxon=row['taxon'];pid=ph['id'];visual=notes[row['number']]
        assert ph['license_code'] in ['cc0','cc-by'] and not ph.get('hidden') and not ph.get('flags') and not ph.get('moderator_actions')
        assert row['quality']=='research'
        assert taxon['name']==name or (name=='Hatiora salicornioides' and taxon['name']=='Hatiora salicornoides')
        assert not any(oldph['photoId']==pid for p in before['plants'] for oldph in p['photos'])
        source_url=ph['url'].replace('/square.','/large.')
        assert re.fullmatch(r'https://(?:inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)/photos/\d+/large\.(?:jpg|jpeg|png|webp)',source_url)
        content=(ROOT/'backups/cactaceae-2026-11-11/full'/row['stagedFileName']).read_bytes()
        digest=hashlib.sha256(content).hexdigest()
        destination=ROOT/'assets/plants'/row['stagedFileName']
        evidence_path=ROOT/'sources/inaturalist/photos'/f'{pid}.json'
        if destination.exists() or evidence_path.exists():
            assert destination.exists() and evidence_path.exists(), 'Incomplete existing acquisition: do not overwrite.'
            evidence=read(evidence_path)
            assert hashlib.sha256(destination.read_bytes()).hexdigest()==digest==evidence['download']['sha256']
            assert evidence['download']['url']==source_url and evidence['observation']['taxon']['name']==taxon['name']
        else:
            creator=row['user'].get('name') or row['user']['login']
            if ph['license_code']=='cc-by':
                match=re.fullmatch(r'(?:\(c\)|©)\s*(.+),\s*some rights reserved\s*\(CC BY\)',ph['attribution'],re.I)
                creator=match.group(1) if match else ph['attribution']
            evidence=dict(apiUrl='https://api.inaturalist.org/v1/observations/'+str(row['observationId']),photo=ph,creator=creator,
                          observation=dict(id=row['observationId'],quality_grade=row['quality'],taxon=dict(id=taxon['id'],name=taxon['name']),observerLogin=row['user']['login']),
                          download=dict(url=source_url,sha256=digest,retrievedAt=now))
            destination.write_bytes(content);write(evidence_path,evidence)
        rights=dict(license='CC0-1.0',licenseCode='cc0')
        if evidence['photo']['license_code']=='cc-by':
            rights=dict(license='CC-BY-4.0',licenseCode='cc-by',attribution=evidence['photo']['attribution'],
                        licenseUrl='https://creativecommons.org/licenses/by/4.0/',photoPageUrl=f'https://www.inaturalist.org/photos/{pid}')
        annotation=dict(id=f'inat-{pid}',fileName=row['stagedFileName'],photoId=pid,observationId=row['observationId'],taxonId=taxon['id'],
                        taxonName=taxon['name'],creator=evidence['creator'],**rights,sourceUrl=source_url,
                        observationUrl='https://www.inaturalist.org/observations/'+str(row['observationId']),downloadedAt=evidence['download']['retrievedAt'],
                        sha256=digest,**visual,reviewStatus='draft')
        plant['photos'].append(annotation)
        media.append(dict(plantId=plant['id'],scientificName=name,photoId=pid,bytes=len(content),licenseCode=rights['licenseCode'],
                          previewNumber=row['number'],visualInspection=True,caption=visual['caption'],markers=visual['markers']))
    assert plant['photos']
    if name in FIRST_PHOTO: plant['photos'].sort(key=lambda ph: ph['photoId']!=FIRST_PHOTO[name])
    added.append(plant['id']);catalog['plants'].append(plant)

restored=copy.deepcopy(catalog)
restored['plants']=restored['plants'][:len(before['plants'])]
for change in changes:
    plant=next(p for p in restored['plants'] if p['id']==change['plantId'])
    for key,value in change['before'].items():
        if value is None: plant.pop(key,None)
        else: plant[key]=value
assert restored==before, 'Unrelated content or previous photos changed.'
write(CATALOG,catalog)
write(OUT/'audit.json',dict(date='2026-11-11',baselineSha256=hashlib.sha256((OUT/'catalog-before.json').read_bytes()).hexdigest(),
                          catalogSha256=hashlib.sha256(CATALOG.read_bytes()).hexdigest(),addedPlantIds=added,updatedProfiles=changes,newPhotos=media,
                          originalMediaBytesAdded=sum(p['bytes'] for p in media),
                          deferred=[dict(name='Cereus hildmannianus',reason='A fonte taxonômica fluminense de 2020 questiona o voucher histórico; mantido fora desta seleção para resolver o conflito explicitamente, sem alterar a planilha.'),
                                    dict(name='Cereus sericifer',reason='Nenhuma foto elegível localizada sob o nome exato; tratamentos taxonômicos diferem quanto à categoria de espécie/subespécie.'),
                                    dict(name='Schlumbergera russelliana',reason='Única observação elegível tinha flores pouco destacadas; seleção adiada por qualidade visual.')]))
print(f'{len(added)} new cactus profiles; {len(changes)} expanded existing profiles; {len(media)} new captioned photos; {sum(p["bytes"] for p in media)/1024**2:.2f} MiB.')
