"""Cache public, photo-license-filtered iNaturalist records for this requested profile."""
import json
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_inat_photos import get
from fetch_flora import fetch

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'sources/imperiale-2026-11-11'
OUT.mkdir(exist_ok=True)

for name in ['Chrysophyllum imperiale', 'Martiusella imperialis']:
    data = fetch('taxon/' + name.replace(' ', '_'), name.replace(' ', '_'))
    print('FLORA', name, json.dumps(data, ensure_ascii=False)[:3500], flush=True)

for license_code in ['cc0', 'cc-by']:
    params = dict(taxon_id=190552, photo_license=license_code, per_page=100,
                  order_by='votes', locale='en')
    url = 'https://api.inaturalist.org/v1/observations?' + urllib.parse.urlencode(params)
    path = OUT / f'inat-{license_code}.json'
    if not path.exists():
        path.write_text(get(url).decode('utf8'), encoding='utf8')
    data = json.loads(path.read_text(encoding='utf8'))
    print(license_code, 'observations:', data.get('total_results'), flush=True)
    for observation in data.get('results', []):
        photos = [ph for ph in observation.get('photos', []) if ph.get('license_code') == license_code]
        print(json.dumps(dict(observationId=observation['id'], name=observation.get('taxon', {}).get('name'),
                             quality=observation.get('quality_grade'), captive=observation.get('captive'),
                             place=observation.get('place_guess'), photos=[dict(id=p['id'],url=p['url']) for p in photos]), ensure_ascii=False), flush=True)
