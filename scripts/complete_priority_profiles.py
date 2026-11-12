"""Append the six coverage-driven completions and two precise caption corrections."""
import copy
import hashlib
import json
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from priority_profile_completions import UPDATES
OUT=ROOT/'sources/begonia-mangrove-2026-11-11';PATH=ROOT/'src/data/plants.json'
def read(path):return json.loads(path.read_text(encoding='utf8'))
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
catalog=read(PATH);audit=read(OUT/'audit.json')
assert hashlib.sha256(PATH.read_bytes()).hexdigest()==audit['catalogSha256']
assert len(audit['updatedProfiles'])==6,'Completion already applied; preserve subsequent edits.'
fields=['commonName','alternateNames','presentation','description','identification','ecology','sources','reviewStatus','curationNotes']
corrections={190912038:'Fruto escuro e arredondado, com sépalas persistentes na extremidade oposta ao pedicelo, entre folhas brilhantes.',
             677119181:'Frutos avermelhados, com sépalas persistentes na extremidade oposta ao pedicelo, entre folhas alongadas.'}
audit['photoAnnotationCorrections']=[]
for plant in catalog['plants']:
    text=UPDATES.get(plant['scientificName'])
    if not text:continue
    original=copy.deepcopy(plant);changed_fields=fields.copy()
    for key in ['description','identification','ecology']:plant[key]=text[key]
    plant['presentation']='profile';plant['reviewStatus']='draft'
    for url in [text['morphologySource']]+text.get('extraSources',[]):
        if not any(source['url']==url for source in plant['sources']):plant['sources'].append(dict(title='Tratamento específico — '+plant['scientificName'],url=url,retrievedAt='2026-11-11'))
    plant['curationNotes']+=' Complementação de 11/11/2026: descrição, identificação e ecologia específicas em rascunho. Fotos e direitos anteriores preservados.'
    for photo in plant['photos']:
        if photo['photoId'] not in corrections:continue
        prior={key:photo[key] for key in ['caption','reviewStatus']}
        photo['caption']=corrections[photo['photoId']];photo['reviewStatus']='draft'
        audit['photoAnnotationCorrections'].append(dict(photoId=photo['photoId'],before=prior,after={key:photo[key] for key in prior},reason='Inspeção da imagem: o cálice persistente fica na extremidade oposta ao pedicelo.'))
    if plant['scientificName']=='Eugenia brasiliensis':
        changed_fields.append('photos')
        plant['curationNotes']+=' Duas legendas de grumixama corrigidas após nova inspeção: sépalas no lado oposto ao pedicelo. Marcadores, arquivos, hashes e demais campos das fotos mantidos.'
    audit['updatedProfiles'].append(dict(plantId=plant['id'],before={key:original.get(key) for key in changed_fields},after={key:plant.get(key) for key in changed_fields}))
restored=copy.deepcopy(catalog);new_ids=set(audit['addedPlantIds']);restored['plants']=[p for p in restored['plants'] if p['id'] not in new_ids]
for change in audit['updatedProfiles']:
    plant=next(p for p in restored['plants'] if p['id']==change['plantId'])
    for key,value in change['before'].items():
        if value is None:plant.pop(key,None)
        else:plant[key]=value
assert restored==read(OUT/'catalog-before.json')
write(PATH,catalog);audit['catalogSha256']=hashlib.sha256(PATH.read_bytes()).hexdigest();write(OUT/'audit.json',audit)
print('Six photographed priority profiles completed; two grumixama captions corrected; old media and rights exact.')
