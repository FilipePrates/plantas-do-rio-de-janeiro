"""Additional cached candidates for fruit and foliar views, visually reviewed later."""
import json,urllib.request
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'sources/family-gaps-2026-11-11';OUT=ROOT/'backups/family-gaps-2026-11-11'
rows=json.loads((SOURCE/'preview-index.json').read_text(encoding='utf8'));seen={r['photo']['id'] for r in rows};extra=[]
for name in ['Allophylus edulis','Zanthoxylum rhoifolium','Maxillaria picta']:
    obs=json.loads((SOURCE/(name.replace(' ','_')+'-cc0.json')).read_text(encoding='utf8'))['data']['results']
    choices=[]
    for o in obs:
        if o['taxon']['name'] not in [name,'Brasiliorchis picta']:continue
        for p in o['photos']:
            if p['id'] in seen or p.get('license_code')!='cc0' or p.get('flags') or p.get('hidden'):continue
            dim=p.get('original_dimensions',{});
            if min(dim.get('width',0),dim.get('height',0))<650:continue
            choices.append((o,p));break
    for o,p in choices[:8]:
        seen.add(p['id']);extra.append(dict(number=len(rows)+len(extra)+1,scientificName=name,observationId=o['id'],photo=p,taxon=o['taxon'],user=o['user'],quality=o['quality_grade'],place=o.get('place_guess'),licenseCode='cc0'))
for start in range(0,len(extra),20):
    sheet=Image.new('RGB',(1600,1600),'#f4f1e7');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
    for i,row in enumerate(extra[start:start+20]):
        p=row['photo'];path=OUT/(str(p['id'])+'.jpg')
        if not path.exists():
            req=urllib.request.Request(p['url'].replace('/square.','/medium.'),headers={'User-Agent':'PlantasDoRio/0.5 (licensed visual QA)'})
            with urllib.request.urlopen(req,timeout=40) as response:path.write_bytes(response.read())
        with Image.open(path) as im:thumb=ImageOps.contain(ImageOps.exif_transpose(im).convert('RGB'),(390,255))
        x,y=i%4*400,i//4*320;sheet.paste(thumb,(x+(400-thumb.width)//2,y))
        draw.text((x+4,y+258),str(row['number'])+' '+row['scientificName'],font=font,fill='#17311f')
        draw.text((x+4,y+280),str(p['id'])+' cc0',font=font,fill='#17311f')
        draw.text((x+4,y+300),(row['place'] or '')[:45],font=font,fill='#17311f')
    sheet.save(OUT/f'details-{start//20+1}.jpg',quality=90)
(SOURCE/'preview-index.json').write_text(json.dumps(rows+extra,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(extra),'additional previews; canonical untouched.')
