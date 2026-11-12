"""Apply the bounded priority batch once, retaining every previous photo byte/field."""
import copy
import hashlib
import json
import re
import sys
import time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from family_gap_texts import NEW,UPDATES

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'sources/family-gaps-2026-11-11'
CATALOG=ROOT/'src/data/plants.json'
FIELDS=['commonName','alternateNames','presentation','description','identification','ecology','sources','reviewStatus','curationNotes']
EXPECTED_BASELINE='0699b989b15470da67c01ef16c65e5c6acf20b6663636eabe9b1fcc97b394954'
ALIASES={}
def read(path):return json.loads(path.read_text(encoding='utf8'))
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def source(title,url):return dict(title=title,url=url,retrievedAt='2026-11-11')
def text_sources(name,text):
    return [source('Tratamento botânico específico — '+name,text['morphologySource'])]+[
        source('Documentação complementar — '+name,url) for url in text.get('extraSources',[])]

assert not (OUT/'audit.json').exists(),'Already applied; preserve subsequent edits.'
assert hashlib.sha256(CATALOG.read_bytes()).hexdigest()==EXPECTED_BASELINE,'Canonical changed: merge explicitly.'
assert not (OUT/'catalog-before.json').exists(),'Existing baseline: do not overwrite.'
catalog=read(CATALOG);before=copy.deepcopy(catalog)
shortlist=read(OUT/'shortlist.json');notes={}
for line in (OUT/'photo-notes.txt').read_text(encoding='utf8').splitlines():
    if not line.strip() or line.startswith('#'):continue
    number,markers,caption=line.split('|',2)
    assert int(number) not in notes
    notes[int(number)]=dict(markers=markers.split(','),caption=caption)
assert set(notes)=={row['number'] for row in shortlist}
assert {row['scientificName'] for row in shortlist}==set(NEW)
old_names={member['scientificName'] for plant in before['plants'] for member in (plant['regionalSpecies'] if plant['rank']=='genus' else [plant])}
assert not old_names.intersection(NEW)
assert sum((ROOT/'backups/family-gaps-2026-11-11/full'/row['stagedFileName']).stat().st_size for row in shortlist)<35*1024**2
write(OUT/'catalog-before.json',before)
now=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
added=[];changes=[];media=[]
for plant in catalog['plants']:
    text=UPDATES.get(plant['scientificName'])
    if not text:continue
    original=copy.deepcopy(plant)
    for field in ['description','identification','ecology']:plant[field]=text[field]
    if text['commonName'] is not None:
        plant['commonName']=text['commonName']
        plant['alternateNames']=list(dict.fromkeys(plant['alternateNames']+text['alternateNames']))
    plant['presentation']='profile';plant['reviewStatus']='draft'
    for item in text_sources(plant['scientificName'],text):
        if not any(s['url']==item['url'] for s in plant['sources']):plant['sources'].append(item)
    plant['curationNotes']=plant.get('curationNotes','')+' Revisão de 11/11/2026: texto específico ampliado; ficha em rascunho para revisão humana. Todas as fotografias, legendas, marcadores, estados de revisão, direitos e ordem da galeria anteriores foram preservados.'
    changes.append(dict(plantId=plant['id'],before={k:original.get(k) for k in FIELDS},after={k:plant.get(k) for k in FIELDS}))

for name,text in NEW.items():
    payload=read(ROOT/'sources/flora'/(name.replace(' ','_')+'.json'))
    record=next(r for r in payload['data'] if r['taxon']['taxonrank']=='ESPECIE' and r['taxon']['genus']+' '+r['taxon']['specificepithet']==name)
    assert record['taxon']['taxonomicstatus']=='NOME_ACEITO'
    profile=record['specie_profile']
    plant=dict(id=name.lower().replace(' ','-'),scientificName=name,authorship=record['taxon']['scientificnameauthorship'],
               commonName=text['commonName'],alternateNames=text['alternateNames'],family=record['taxon']['family'],genus=record['taxon']['genus'],
               rank='species',origin='native',geography='rio-state',presentation='profile',reviewStatus='draft',
               description=text['description'],identification=text['identification'],ecology=text['ecology'],
               lifeForms=profile.get('lifeForm',[]),substrates=text.get('substrates',profile.get('habitat',[])),
               habitats=text.get('habitats',profile.get('vegetationType',[])),floraId=record['taxon']['taxonid'],regionalSpecies=[],photos=[],
               sources=[source('Flora e Funga do Brasil — '+name,payload['url'])]+text_sources(name,text),
               curationNotes='Seleção de 11/11/2026: ficha específica e fotografias anotadas após inspeção individual. Direitos de cada foto CC0 ou CC BY 4.0 arquivados. Textos e novas legendas/marcações permanecem em rascunho. Abrangência estadual; fotos externas ao Rio ilustram caracteres, sem servir de prova municipal. Nomes e classificação seguem o registro da Flora e Funga consultado; datas e divergências são explicitadas.')
    if name=='Ormosia arborea':plant['curationNotes']+=' A resposta estruturada de distribuição não lista RJ; a planilha estadual fornecida e a tabela do tratamento taxonômico citado incluem RJ. A ausência nessa resposta não foi tratada como ausência da espécie no estado.'
    if name in ['Begonia luxurians','Begonia solananthera']:plant['curationNotes']+=' Revisão de Moonlight & Lima (2025) consultada: nome posterior ou uso anterior explicado na ecologia; não criar ficha duplicada para o nome alternativo.'
    if name=='Schizolobium parahyba':plant['curationNotes']+=' A consulta ao serviço retorna também variedades. Foi selecionado o registro exato de espécie FB23143; atributos amazônicos não foram generalizados para a planta atlântica.'
    if any(key in text for key in ['habitats','substrates']):plant['curationNotes']+=' Ambientes/substratos complementados ou selecionados a partir das fontes específicas citadas; a resposta estruturada original continua arquivada.'
    for row in [r for r in shortlist if r['scientificName']==name]:
        photo=row['photo'];taxon=row['taxon'];pid=photo['id'];visual=notes[row['number']]
        assert photo['license_code'] in ['cc0','cc-by'] and not photo.get('hidden') and not photo.get('flags') and not photo.get('moderator_actions')
        assert row['quality']=='research'
        assert taxon['name'] in {name}|ALIASES.get(name,set())
        assert not any(ph['photoId']==pid for p in before['plants'] for ph in p['photos'])
        url=photo['url'].replace('/square.','/large.')
        assert re.fullmatch(r'https://(?:inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)/photos/\d+/large\.(?:jpg|jpeg|png|webp)',url)
        content=(ROOT/'backups/family-gaps-2026-11-11/full'/row['stagedFileName']).read_bytes()
        assert content.startswith(b'\xff\xd8\xff') or content.startswith(b'\x89PNG\r\n\x1a\n') or content.startswith(b'RIFF')
        digest=hashlib.sha256(content).hexdigest();destination=ROOT/'assets/plants'/row['stagedFileName'];evidence_path=ROOT/'sources/inaturalist/photos'/f'{pid}.json'
        assert not destination.exists() and not evidence_path.exists(),'Existing acquisition: merge explicitly; do not overwrite.'
        creator=row['user'].get('name') or row['user']['login']
        if photo['license_code']=='cc-by':
            match=re.fullmatch(r'(?:\(c\)|©)\s*(.+),\s*some rights reserved\s*\(CC BY\)',photo['attribution'],re.I)
            creator=match.group(1) if match else photo['attribution']
        evidence=dict(apiUrl='https://api.inaturalist.org/v1/observations/'+str(row['observationId']),photo=photo,creator=creator,
                      observation=dict(id=row['observationId'],quality_grade=row['quality'],taxon=dict(id=taxon['id'],name=taxon['name']),observerLogin=row['user']['login']),
                      download=dict(url=url,sha256=digest,retrievedAt=now))
        destination.write_bytes(content);write(evidence_path,evidence)
        rights=dict(license='CC0-1.0',licenseCode='cc0')
        if photo['license_code']=='cc-by':rights=dict(license='CC-BY-4.0',licenseCode='cc-by',attribution=photo['attribution'],licenseUrl='https://creativecommons.org/licenses/by/4.0/',photoPageUrl=f'https://www.inaturalist.org/photos/{pid}')
        annotation=dict(id=f'inat-{pid}',fileName=row['stagedFileName'],photoId=pid,observationId=row['observationId'],taxonId=taxon['id'],taxonName=taxon['name'],
                        creator=creator,**rights,sourceUrl=url,observationUrl='https://www.inaturalist.org/observations/'+str(row['observationId']),
                        downloadedAt=now,sha256=digest,**visual,reviewStatus='draft')
        plant['photos'].append(annotation)
        media.append(dict(plantId=plant['id'],scientificName=name,photoId=pid,bytes=len(content),licenseCode=rights['licenseCode'],previewNumber=row['number'],
                          visualInspection=True,caption=visual['caption'],markers=visual['markers']))
    assert plant['photos']
    added.append(plant['id']);catalog['plants'].append(plant)

restored=copy.deepcopy(catalog);restored['plants']=restored['plants'][:len(before['plants'])]
for change in changes:
    plant=next(p for p in restored['plants'] if p['id']==change['plantId'])
    for key,value in change['before'].items():
        if value is None:plant.pop(key,None)
        else:plant[key]=value
assert restored==before,'Unrelated fields or previous photo annotations changed.'
write(CATALOG,catalog)
write(OUT/'audit.json',dict(date='2026-11-11',baselineSha256=EXPECTED_BASELINE,catalogSha256=hashlib.sha256(CATALOG.read_bytes()).hexdigest(),
                          addedPlantIds=added,updatedProfiles=changes,newPhotos=media,originalMediaBytesAdded=sum(p['bytes'] for p in media),
                          deferred=[dict(name='Cattleya lobata',reason='Nenhuma observa??o com fotografia eleg?vel encontrada na consulta arquivada.'),
                                    dict(name='Cattleya warneri',reason='Fora da planilha de ?rvores/arbustos; a resposta espec?fica consultada n?o confirma ocorr?ncia nativa no RJ.'),
                                    dict(name='Eulophia alta',reason='Fora da planilha de ?rvores/arbustos; a resposta espec?fica consultada n?o confirma ocorr?ncia nativa no RJ.')]))
print(len(added),'new profiles;',len(changes),'existing profiles expanded;',len(media),'captioned photos;',round(sum(p['bytes'] for p in media)/1024**2,2),'MiB.')
