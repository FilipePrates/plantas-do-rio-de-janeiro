"""Cache complete genus profiles using the lighter family index plus species calls.

The full /taxon/Genus endpoint can time out. This alternative keeps each
species response as evidence and derives an explicit, reproducible aggregate.
At most two requests start per second, with three concurrent requests.
"""
import concurrent.futures
import json
import threading
import time
from pathlib import Path
from fetch_flora import fetch, CACHE, ROOT

lock = threading.Lock()
next_request = 0.0

def fetch_one(name):
    global next_request
    with lock:
        delay = max(0, next_request - time.monotonic())
        time.sleep(delay)
        next_request = time.monotonic() + 0.55
    fetch('taxon/' + name.replace(' ', '_'), name.replace(' ', '_'))
    return name

if __name__ == '__main__':
    CACHE.mkdir(parents=True, exist_ok=True)
    fetch('species/Araceae', 'index-Araceae')
    index = json.loads((CACHE / 'index-Araceae.json').read_text())
    for genus in ['Anthurium', 'Philodendron']:
        names = sorted({t['genus'] + ' ' + t['specificepithet'] for t in index['data'] if t.get('genus') == genus and t.get('taxonrank') == 'ESPECIE' and t.get('taxonomicstatus') == 'NOME_ACEITO'})
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            for number, name in enumerate(pool.map(fetch_one, names)):
                print(f'{genus}: {number + 1}/{len(names)} {name}', flush=True)
        profiles, urls, dates = [], [], []
        for name in names:
            payload = json.loads((CACHE / (name.replace(' ', '_') + '.json')).read_text())
            profiles.extend(payload['data']); urls.append(payload['url']); dates.append(payload['retrievedAt'])
        result = {'url': index['url'], 'retrievedAt': max(dates), 'method': 'Accepted species in family index; complete cached species profiles. Exact filters are in generate_seed.py.', 'profileUrls': urls, 'data': profiles}
        temp = CACHE / (genus + '.json.tmp')
        temp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n'); temp.replace(CACHE / (genus + '.json'))
    # Retrieve required introduced taxa without waiting for full-genus endpoints.
    for name in ['Leucaena leucocephala', 'Epipremnum aureum', 'Tradescantia zebrina', 'Artocarpus heterophyllus', 'Megathyrsus maximus']:
        fetch_one(name)
