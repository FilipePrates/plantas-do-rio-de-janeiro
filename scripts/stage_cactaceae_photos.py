"""Download a bounded visual shortlist; no canonical catalog/evidence writes."""
import json
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from fetch_inat_photos import get

SOURCE=ROOT/'sources/cactaceae-2026-11-11'
OUT=ROOT/'backups/cactaceae-2026-11-11/full'
OUT.mkdir(exist_ok=True)
NUMBERS=[1,4,7,12,14,16,19,23,26,30,33,39,42,47,50,55,59,61,62,65,67,69,70,78,80,87,88,98,99,102,103,104]
rows=json.loads((SOURCE/'preview-index.json').read_text(encoding='utf8'))
selected=[next(r for r in rows if r['number']==n) for n in NUMBERS]
hatiora=next(o for o in json.loads((SOURCE/'Hatiora_salicornioides-cc-by.json').read_text(encoding='utf8'))['data']['results'] if o['id']==93079332)
flower=next(p for p in hatiora['photos'] if p['id']==154212728)
selected.append(dict(number=112,scientificName='Hatiora salicornioides',observationId=hatiora['id'],
                     photo=flower,taxon=hatiora['taxon'],user=hatiora['user'],quality=hatiora['quality_grade'],
                     place=hatiora.get('place_guess'),licenseCode='cc-by'))
for row in selected:
    photo=row['photo'];filename='inat-'+str(photo['id'])+'.'+photo['url'].split('.')[-1]
    path=OUT/filename
    if not path.exists(): path.write_bytes(get(photo['url'].replace('/square.','/large.')))
    print(row['number'], row['scientificName'], photo['id'], path.stat().st_size, flush=True)
    row['stagedFileName']=filename
(SOURCE/'shortlist.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Total:',sum((OUT/r['stagedFileName']).stat().st_size for r in selected),'bytes.')
