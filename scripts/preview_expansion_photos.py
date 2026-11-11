"""Internal contact sheets for visual QA; never changes licensed originals or review states."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'backups/expansion-contact-sheets'
OUT.mkdir(parents=True, exist_ok=True)
catalog = json.loads((ROOT / 'src/data/plants.json').read_text(encoding='utf8'))
before = json.loads((ROOT / 'sources/expansion-2026-11-11/catalog-before.json').read_text(encoding='utf8'))
old = {p['photoId'] for plant in before['plants'] for p in plant['photos']}
items = [(plant, photo) for plant in catalog['plants'] for photo in plant['photos'] if photo['photoId'] not in old]
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
for start in range(0, len(items), 20):
    sheet = Image.new('RGB', (1200, 1300), '#f4f1e7')
    draw = ImageDraw.Draw(sheet)
    for index, (plant, photo) in enumerate(items[start:start + 20]):
        x, y = (index % 4) * 300, (index // 4) * 260
        with Image.open(ROOT / 'assets/plants' / photo['fileName']) as original:
            thumbnail = ImageOps.contain(ImageOps.exif_transpose(original).convert('RGB'), (290, 215))
        sheet.paste(thumbnail, (x + (300 - thumbnail.width) // 2, y))
        draw.text((x + 5, y + 218), photo['taxonName'], font=font, fill='#172a1d')
        draw.text((x + 5, y + 237), f"{photo['photoId']} ({photo['licenseCode']})", font=font, fill='#172a1d')
    path = OUT / f'{start // 20 + 1:02d}.jpg'
    sheet.save(path, quality=88)
    print(path)
print(f'{len(items)} new photographs; originals and draft states preserved.')
