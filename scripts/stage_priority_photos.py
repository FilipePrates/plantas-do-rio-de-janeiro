"""Stage selected large photos without changing canonical data or rights evidence."""
import concurrent.futures
import json
import urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'sources/begonia-mangrove-2026-11-11'
OUT=ROOT/'backups/begonia-mangrove-2026-11-11/full'
OUT.mkdir(exist_ok=True)
NUMBERS=[4,6,7,8,10,15,16,18,20,24,27,30,31,36,39,41,47,52,54,
         55,57,60,65,66,69,71,75,78,83,87,90,92,93,94,95,97,98,
         101,102,107,108,115,117,121,122,123,128,131,137,141,147,149]
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
