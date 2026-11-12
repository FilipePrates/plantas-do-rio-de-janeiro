"""Stage selected large photos without changing canonical data or rights evidence."""
import concurrent.futures
import json
import urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'sources/family-gaps-2026-11-11'
OUT=ROOT/'backups/family-gaps-2026-11-11/full'
OUT.mkdir(exist_ok=True)
NUMBERS=[1,6,9,13,17,20,21,23,24,28,30,104,36,38,39,43,47,115,51,56,59,60,69,70,73,74,76,79,82,83,86,87,90,91,97,98]
rows=json.loads((SOURCE/'preview-index.json').read_text(encoding='utf8'))
selected=[next(row for row in rows if row['number']==n) for n in NUMBERS]
def download(row):
    photo=row['photo'];row['stagedFileName']='inat-'+str(photo['id'])+'.'+photo['url'].rsplit('.',1)[1]
    path=OUT/row['stagedFileName']
    if not path.exists():
        request=urllib.request.Request(photo['url'].replace('/square.','/large.'),headers={'User-Agent':'PlantasDoRio/0.5 (licensed offline field guide)'})
        with urllib.request.urlopen(request,timeout=45) as response: path.write_bytes(response.read())
    return path.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: sizes=list(pool.map(download,selected))
assert sum(sizes)<35*1024*1024
(SOURCE/'shortlist.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(selected),'photos;',round(sum(sizes)/1024**2,2),'MiB;',len(set(r['scientificName'] for r in selected)),'species.')
