"""Numbered previews for direct visual selection; never imports app photographs."""
import concurrent.futures
import json
from pathlib import Path
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'sources/cactaceae-2026-11-11'
OUT=ROOT/'backups/cactaceae-2026-11-11'
OUT.mkdir(exist_ok=True)
EXCLUDE={'Cereus hildmannianus','Cereus sericifer'}
rows=[]
for name, record in json.loads((SOURCE/'survey.json').read_text(encoding='utf8')).items():
    if name in EXCLUDE or record.get('status') != 'NOME_ACEITO': continue
    for code in ['cc0','cc-by']:
        path=SOURCE/(name.replace(' ','_')+'-'+code+'.json')
        if not path.exists(): continue
        data=json.loads(path.read_text(encoding='utf8'))['data']
        eligible=[]
        for obs in data['results']:
            if obs.get('quality_grade')!='research' or obs.get('captive') is True or obs.get('flags'): continue
            observed_name=obs.get('taxon',{}).get('name')
            if observed_name!=name and not (name=='Hatiora salicornioides' and observed_name=='Hatiora salicornoides'): continue
            count=0
            for photo in obs.get('photos',[]):
                if photo.get('license_code')!=code or photo.get('hidden') or photo.get('flags') or photo.get('moderator_actions'): continue
                if code=='cc-by' and not photo.get('attribution'): continue
                dimensions=photo.get('original_dimensions') or {}
                if min(dimensions.get('width',0),dimensions.get('height',0))<650: continue
                eligible.append(dict(scientificName=name,observationId=obs['id'],photo=photo,
                                     taxon=obs['taxon'],user=obs['user'],quality=obs['quality_grade'],
                                     place=obs.get('place_guess'),licenseCode=code))
                count+=1
                if count==2: break
            if len(eligible)>=(6 if code=='cc0' else 3): break
        rows.extend(eligible[:6 if code=='cc0' else 3])

def download(row):
    photo=row['photo'];path=OUT/(str(photo['id'])+'.jpg')
    if not path.exists():
        request=urllib.request.Request(photo['url'].replace('/square.','/medium.'),headers={'User-Agent':'PlantasDoRio/0.4 (licensed cactus preview)'})
        with urllib.request.urlopen(request,timeout=35) as response: path.write_bytes(response.read())
    return path

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: paths=list(pool.map(download,rows))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
for start in range(0,len(rows),20):
    sheet=Image.new('RGB',(1600,1600),'#f4f1e7');draw=ImageDraw.Draw(sheet)
    for slot,(row,path) in enumerate(zip(rows[start:start+20],paths[start:start+20])):
        x,y=slot%4*400,slot//4*320
        with Image.open(path) as source: thumb=ImageOps.contain(ImageOps.exif_transpose(source).convert('RGB'),(390,255))
        sheet.paste(thumb,(x+(400-thumb.width)//2,y))
        draw.text((x+4,y+258),str(start+slot+1)+' '+row['scientificName'],font=font,fill='#17311f')
        draw.text((x+4,y+280),str(row['photo']['id'])+' '+row['licenseCode'],font=font,fill='#17311f')
        draw.text((x+4,y+300),(row['place'] or '')[:53],font=small,fill='#17311f')
    sheet.save(OUT/f'contact-{start//20+1:02d}.jpg',quality=90)
for number,row in enumerate(rows,1): row['number']=number
(SOURCE/'preview-index.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'{len(rows)} previews on {(len(rows)+19)//20} sheets; originals unchanged.')
