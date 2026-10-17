"""Public JBRJ data only. Cache before transforming; never overwrite edited catalog.

Run fetch, then generate_seed.py separately. One request at a time; caches are
reused. JBRJ's taxon endpoint spells its distribution field `distribuition`.
"""
import argparse
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'sources' / 'flora'
BASE = 'https://servicos.jbrj.gov.br/v2/flora/'

def fetch(path, key):
    target = CACHE / (key + '.json')
    if target.exists():
        return json.loads(target.read_text())
    url = BASE + urllib.parse.quote(path, safe='/')
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'PlantasDoRioDraft/0.1 (offline field guide curation)'})
            with urllib.request.urlopen(req, timeout=75) as response:
                data = json.load(response)
            target.write_text(json.dumps({'url': url, 'retrievedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'data': data}, ensure_ascii=False, indent=2) + '\n')
            time.sleep(0.5)
            return data
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)

if __name__ == '__main__':
    CACHE.mkdir(parents=True, exist_ok=True)
    selection = json.loads((ROOT / 'scripts/seed-selection.json').read_text())
    names = [name for family in selection.values() for name in family]
    names += ['Leucaena leucocephala', 'Epipremnum aureum', 'Tradescantia zebrina', 'Artocarpus heterophyllus', 'Megathyrsus maximus']
    for index, name in enumerate(names):
        try:
            fetch('taxon/' + name.replace(' ', '_'), name.replace(' ', '_'))
            print(f'{index + 1}/{len(names)} {name}', flush=True)
        except Exception as exc:
            print(f'FAILED {name}: {exc}', flush=True)
