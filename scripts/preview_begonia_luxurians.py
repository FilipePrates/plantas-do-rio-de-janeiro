"""Preview iNaturalist's updated name after checking the 2025 nomenclatural paper."""
import json
import urllib.request
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'sources/begonia-mangrove-2026-11-11'
OUT=ROOT/'backups/begonia-mangrove-2026-11-11'
rows=[]
for code in ['cc0','cc-by']:
    for obs in json.loads((SOURCE/('Begonia_luxurians-'+code+'.json')).read_text(encoding='utf8'))['data']['results'][:2]:
        assert obs['taxon']['name']=='Begonia verticillata'
        for photo in obs['photos'][:2]:
            if photo.get('license_code')!=code or photo.get('flags') or photo.get('hidden'):continue
            rows.append(dict(number=142+len(rows),scientificName='Begonia luxurians',observationId=obs['id'],photo=photo,
                             taxon=obs['taxon'],user=obs['user'],quality=obs['quality_grade'],place=obs.get('place_guess'),licenseCode=code))
sheet=Image.new('RGB',(1600,640),'#f4f1e7');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
for i,row in enumerate(rows):
    photo=row['photo'];path=OUT/(str(photo['id'])+'.jpg')
    if not path.exists():
        request=urllib.request.Request(photo['url'].replace('/square.','/medium.'),headers={'User-Agent':'PlantasDoRio/0.5 (licensed visual QA)'})
        with urllib.request.urlopen(request,timeout=40) as response:path.write_bytes(response.read())
    with Image.open(path) as source:thumb=ImageOps.contain(ImageOps.exif_transpose(source).convert('RGB'),(390,255))
    x,y=i%4*400,i//4*320;sheet.paste(thumb,(x+(400-thumb.width)//2,y))
    draw.text((x+4,y+258),str(row['number'])+' B. luxurians / verticillata',font=font,fill='#17311f')
    draw.text((x+4,y+280),str(photo['id'])+' '+row['licenseCode'],font=font,fill='#17311f')
    draw.text((x+4,y+300),(row['place'] or '')[:45],font=font,fill='#17311f')
sheet.save(OUT/'luxurians.jpg',quality=90)
(SOURCE/'luxurians-previews.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(rows),'updated-name previews.')
