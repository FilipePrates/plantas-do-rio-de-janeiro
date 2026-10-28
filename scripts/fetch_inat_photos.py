"""Import photo-level CC0 (default) or CC BY 4.0 media with rights evidence.

Never imports the taxon's default_photo. Records stay drafts until visual
review. Observation annotations describe observations, so they are NOT used
to guess flower/fruit labels for individual photos. Repeat runs skip entries
already containing the requested number of photos.
"""
import argparse
import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'src/data/plants.json'
EVIDENCE = ROOT / 'sources/inaturalist/photos'
LAST_REQUEST = 0.0

def get(url):
    global LAST_REQUEST
    time.sleep(max(0, 1.1 - (time.monotonic() - LAST_REQUEST)))
    LAST_REQUEST = time.monotonic()
    request = urllib.request.Request(url, headers={'User-Agent': 'PlantasDoRioDraft/0.2 (licensed offline field guide)'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))

def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--per-plant', type=int, default=None, help='Optional target number of photos per plant; no fixed default limit.')
    parser.add_argument('--ids', nargs='*', default=[])
    parser.add_argument('--license', choices=['cc0', 'cc-by'], default='cc0', help='Photo-level license; CC BY requires preserved attribution.')
    parser.add_argument('--taxon-name', help='Search a named member of one selected genus group; it must be listed in regionalSpecies.')
    args = parser.parse_args()
    if args.per_plant is not None and args.per_plant < 1:
        parser.error('--per-plant must be positive')
    if args.taxon_name and len(args.ids) != 1:
        parser.error('--taxon-name requires exactly one entry in --ids')
    catalog = json.loads(CATALOG.read_text())
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (ROOT / 'assets/plants').mkdir(parents=True, exist_ok=True)
    used = {photo['photoId'] for plant in catalog['plants'] for photo in plant['photos']}
    report_file = ROOT / 'sources/inaturalist/import-report.json'
    previous = json.loads(report_file.read_text()) if report_file.exists() else []
    report = []
    for index, plant in enumerate(catalog['plants']):
        if args.ids and plant['id'] not in args.ids:
            continue
        if args.per_plant is not None and len(plant['photos']) >= args.per_plant:
            continue
        name = plant['genus'] if plant['rank'] == 'genus' else plant['scientificName']
        allowed_names = {s['scientificName'] for s in plant['regionalSpecies']} if plant['rank'] == 'genus' else {name}
        if args.taxon_name:
            if args.taxon_name not in allowed_names:
                parser.error('--taxon-name must match the species or a native regional member of this group')
            name = args.taxon_name
        params = {'taxon_name': name, 'photo_license': args.license, 'quality_grade': 'research', 'captive': 'false', 'per_page': 30, 'order_by': 'votes', 'locale': 'en'}
        try:
            data = json.loads(get('https://api.inaturalist.org/v1/observations?' + urllib.parse.urlencode(params)))
            for observation in data['results']:
                taxon = observation.get('taxon') or {}
                if taxon.get('name') not in allowed_names or observation.get('quality_grade') != 'research':
                    continue
                if observation.get('captive') is True or observation.get('flags'):
                    continue
                for photo in observation.get('photos', []):
                    if photo.get('license_code') != args.license or photo['id'] in used or photo.get('hidden') or photo.get('flags') or photo.get('moderator_actions'):
                        continue
                    if args.license == 'cc-by' and not (photo.get('attribution') or '').strip():
                        continue
                    dimensions = photo.get('original_dimensions') or {}
                    if min(dimensions.get('width', 0), dimensions.get('height', 0)) < 400:
                        continue
                    source = re.sub(r'/square\.', '/large.', photo['url'])
                    url = urllib.parse.urlparse(source)
                    if url.scheme != 'https' or url.hostname not in ['inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org'] or not re.fullmatch(r'/photos/\d+/large\.(jpg|jpeg|png|webp)', url.path):
                        continue
                    payload = get(source)
                    is_image = payload.startswith(b'\xff\xd8\xff') or payload.startswith(b'\x89PNG\r\n\x1a\n') or (payload.startswith(b'RIFF') and payload[8:12] == b'WEBP')
                    if not is_image or len(payload) > 12_000_000:
                        continue
                    suffix = url.path.rsplit('.', 1)[1]
                    filename = f'inat-{photo["id"]}.{suffix}'
                    digest = hashlib.sha256(payload).hexdigest()
                    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                    user = observation.get('user') or {}
                    creator = user.get('name') or user.get('login') or 'Colaborador iNaturalist'
                    rights = {'license': 'CC0-1.0', 'licenseCode': 'cc0'}
                    if args.license == 'cc-by':
                        attribution = photo['attribution']
                        match = re.fullmatch(r'(?:\(c\)|©)\s*(.+),\s*some rights reserved\s*\(CC BY\)', attribution, re.I)
                        creator = match.group(1) if match else attribution
                        rights = {'license': 'CC-BY-4.0', 'licenseCode': 'cc-by', 'attribution': attribution, 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/', 'photoPageUrl': f'https://www.inaturalist.org/photos/{photo["id"]}'}
                    # Never overwrite acquisition evidence from an earlier import.
                    if (EVIDENCE / f'{photo["id"]}.json').exists() or (ROOT / 'assets/plants' / filename).exists():
                        continue
                    (ROOT / 'assets/plants' / filename).write_bytes(payload)
                    write_json(EVIDENCE / f'{photo["id"]}.json', {
                        'apiUrl': 'https://api.inaturalist.org/v1/observations/' + str(observation['id']),
                        'photo': photo, 'creator': creator,
                        'observation': {'id': observation['id'], 'quality_grade': observation['quality_grade'], 'taxon': {'id': taxon['id'], 'name': taxon['name']}, 'observerLogin': user.get('login')},
                        'download': {'url': source, 'sha256': digest, 'retrievedAt': now}
                    })
                    plant['photos'].append({
                        'id': f'inat-{photo["id"]}', 'fileName': filename,
                        'photoId': photo['id'], 'observationId': observation['id'],
                        'taxonId': taxon['id'], 'taxonName': taxon['name'], 'creator': creator,
                        **rights, 'sourceUrl': source,
                        'observationUrl': f'https://www.inaturalist.org/observations/{observation["id"]}',
                        'downloadedAt': now, 'sha256': digest, 'markers': ['unknown'],
                        'caption': '', 'reviewStatus': 'draft'
                    })
                    used.add(photo['id'])
                    break  # One image per observation, to favor different views.
                if args.per_plant is not None and len(plant['photos']) >= args.per_plant:
                    break
            temp = CATALOG.with_suffix('.json.tmp')
            catalog['updatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            write_json(temp, catalog)
            temp.replace(CATALOG)
            report.append({'id': plant['id'], 'photos': len(plant['photos']), 'photoLicense': args.license, 'matchingObservationCount': data.get('total_results')})
            print(f'{index + 1}/{len(catalog["plants"])} {name}: {len(plant["photos"])} photos ({args.license} search)', flush=True)
        except Exception as exc:
            report.append({'id': plant['id'], 'error': str(exc)})
            print(f'FAILED {name}: {exc}', flush=True)
    combined = {row['id']: row for row in previous}
    combined.update({row['id']: row for row in report})
    write_json(report_file, list(combined.values()))
