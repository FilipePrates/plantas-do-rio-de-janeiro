"""Temporary medium previews of eligible candidates; never imports app media."""
import concurrent.futures
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'backups/photo-selection/candidates'
OUT.mkdir(parents=True, exist_ok=True)
report = json.loads((ROOT / 'sources/photo-selection-2026-11-11/photo-survey.json').read_text(encoding='utf8'))
items = []
for name, row in report.items():
    selected = []
    for license_code in ['cc0', 'cc-by']:
        observations = set()
        for candidate in row['photos']:
            if candidate['photo']['license_code'] == license_code and candidate['observationId'] not in observations:
                selected.append((name, candidate))
                observations.add(candidate['observationId'])
                if len(observations) == 2:
                    break
    items.extend(selected)


def fetch(item):
    name, candidate = item
    photo = candidate['photo']
    path = OUT / (str(photo['id']) + '.jpg')
    url = photo['url'].replace('/square.', '/medium.')
    parts = urllib.parse.urlparse(url)
    assert parts.hostname in ['inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org'] and parts.scheme == 'https'
    assert re.fullmatch(r'/photos/\d+/medium\.(?:jpg|jpeg|png|webp)', parts.path)
    if not path.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'PlantasDoRio/0.4 (temporary licensed photo QA)'})
        with urllib.request.urlopen(request, timeout=25) as response:
            path.write_bytes(response.read())
    return name, candidate, path


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(fetch, items))
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
for start in range(0, len(results), 20):
    canvas = Image.new('RGB', (1200, 1300), '#f4f1e7')
    draw = ImageDraw.Draw(canvas)
    for index, (name, candidate, path) in enumerate(results[start:start+20]):
        x, y = (index % 4) * 300, (index // 4) * 260
        with Image.open(path) as image:
            thumbnail = ImageOps.contain(image.convert('RGB'), (290, 215))
        canvas.paste(thumbnail, (x+(300-thumbnail.width)//2, y))
        draw.text((x+5, y+218), name, font=font, fill='#17311f')
        draw.text((x+5, y+240), str(candidate['photo']['id'])+' '+candidate['photo']['license_code'], font=font, fill='#17311f')
    path = OUT / f'contact-{start//20+1}.jpg'
    canvas.save(path, quality=88)
    print(path)
print(f'{len(results)} medium previews; no app files changed.')
