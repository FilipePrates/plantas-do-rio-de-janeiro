"""Image-led workbook pass: trust supplied state scope; survey licenses, not occurrence.

No catalog mutations or image downloads. Exact names, research-grade observations
and photo-level CC0 / CC BY evidence only. Supports resumable, bounded requests.
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from prepare_scope import read_workbook

FOLDER = ROOT / 'sources/photo-selection-2026-11-11'
NAMES = '''Chrysobalanus icaco;Jacaratia spinosa;Cordia superba;Tabernaemontana laeta;Lecythis lurida;Eriotheca pentaphylla;Pachira glabra;Carpotroche brasiliensis;Chloroleucon tortum;Centrolobium tomentosum;Swartzia langsdorffii;Erythrina verna;Pleroma heteromallum;Miconia mirabilis;Solanum cernuum;Brunfelsia uniflora;Brunfelsia pauciflora;Brunfelsia brasiliensis;Talipariti pernambucense;Pavonia multiflora;Stifftia chrysantha;Stifftia fruticosa'''.split(';')


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'PlantasDoRio/0.4 (bounded photo selection)'})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def main():
    FOLDER.mkdir(exist_ok=True)
    rows = {r['species']: r for r in read_workbook(ROOT / 'docs/Arvores_Arbustos_Nativos_RJ.xlsx')}
    catalog = json.loads((ROOT / 'src/data/plants.json').read_text(encoding='utf8'))
    baseline = FOLDER / 'catalog-before.json'
    if not baseline.exists():
        baseline.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    report_file = FOLDER / 'photo-survey.json'
    report = json.loads(report_file.read_text(encoding='utf8')) if report_file.exists() else {}
    for index, name in enumerate(NAMES):
        assert name in rows, name
        if report.get(name, {}).get('complete'):
            continue
        row = {'scientificName': name, 'workbookRow': rows[name]['workbookRow'], 'scopeAuthority': 'Supplied workbook, per user instruction; no new Rio occurrence checks.', 'photos': []}
        try:
            for license_code in ['cc0', 'cc-by']:
                params = {'taxon_name': name, 'photo_license': license_code, 'quality_grade': 'research', 'captive': 'false', 'per_page': 5, 'order_by': 'votes'}
                url = 'https://api.inaturalist.org/v1/observations?' + urllib.parse.urlencode(params)
                data = get(url)
                row.setdefault('queries', []).append({'url': url, 'retrievedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'matchingObservations': data['total_results']})
                for obs in data['results']:
                    if obs.get('taxon', {}).get('name') != name or obs.get('captive') or obs.get('flags') or obs.get('quality_grade') != 'research':
                        continue
                    for photo in obs.get('photos', []):
                        dims = photo.get('original_dimensions') or {}
                        if photo.get('license_code') != license_code or photo.get('hidden') or photo.get('flags') or photo.get('moderator_actions') or min(dims.get('width', 0), dims.get('height', 0)) < 600:
                            continue
                        row['photos'].append({'observationId': obs['id'], 'taxonId': obs['taxon']['id'], 'taxonName': name, 'photo': photo})
                time.sleep(1.1)
            row['complete'] = True
        except Exception as error:
            row['error'] = str(error)
        report[name] = row
        report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
        print(f"{index+1}/{len(NAMES)} {name}: {len(row['photos'])} eligible candidates {row.get('error', '')}", flush=True)


if __name__ == '__main__':
    main()
