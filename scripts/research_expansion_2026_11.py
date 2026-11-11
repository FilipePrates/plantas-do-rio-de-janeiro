"""Dated, resumable public-source research; never changes the application catalog.

Exact accepted native BR-RJ / Atlantic Forest records are required. iNaturalist
is used for licensed illustrations, never as proof of native occurrence.
"""
import hashlib
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from generate_seed import binomial, eligible

OUT = ROOT / 'sources/expansion-2026-11-11'
NEW = '''Aechmea bromeliifolia;Aechmea gracilis;Aechmea pectinata;Aechmea ramosa;Aechmea ornata;Aechmea sphaerocephala;Aechmea weilbachii;Neoregelia johannis;Neoregelia concentrica;Neoregelia sarmentosa;Neoregelia pauciflora;Nidularium innocentii;Nidularium procerum;Vriesea botafogensis;Vriesea neoglutinosa;Vriesea fosteriana;Vriesea philippocoburgii;Vriesea ensiformis;Vriesea inflata;Vriesea longicaulis;Vriesea scalaris;Tillandsia aeranthos;Tillandsia geminiflora;Tillandsia recurvata;Tillandsia tricholepis;Quesnelia liboniana;Quesnelia lateralis;Quesnelia marmorata;Quesnelia strobilispica;Billbergia zebrina;Billbergia sanderiana;Wittrockia superba;Garcinia brasiliensis;Garcinia gardneriana;Annona sylvatica;Annona cacans;Annona dolabripetala;Annona mucosa;Pouteria psammophila;Pouteria reticulata;Chrysophyllum gonocarpum;Inga vera;Inga sessilis'''.split(';')
SPLIT = '''Anthurium scandens;Anthurium harrisii;Anthurium intermedium;Anthurium solitarium;Anthurium comtum;Anthurium longifolium;Anthurium parasiticum;Anthurium sellowianum;Anthurium urvilleanum;Anthurium microphyllum;Philodendron appendiculatum;Philodendron bipennifolium;Philodendron cordatum;Philodendron crassinervium;Philodendron martianum;Philodendron pedatum;Philodendron hastatum;Philodendron ornatum;Philodendron propinquum;Philodendron alternans;Eugenia astringens;Eugenia sulcata;Eugenia candolleana;Eugenia copacabanensis;Eugenia punicifolia'''.split(';')


def write(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf8')


def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'PlantasDoRio/0.3 (botanical draft and CC0/CC-BY research)'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 + attempt * 2)


def main():
    OUT.mkdir(exist_ok=True)
    catalog = json.loads((ROOT / 'src/data/plants.json').read_text(encoding='utf8'))
    baseline = OUT / 'catalog-before.json'
    if not baseline.exists():
        write(baseline, catalog)
    # The actual supplied workbook is read, without modifying its bytes.
    from prepare_scope import read_workbook
    workbook = ROOT / 'docs/Arvores_Arbustos_Nativos_RJ.xlsx'
    candidates = read_workbook(workbook)
    write(OUT / 'workbook-index.json', {
        'path': 'docs/Arvores_Arbustos_Nativos_RJ.xlsx',
        'sha256': hashlib.sha256(workbook.read_bytes()).hexdigest(),
        'rows': len(candidates),
        'priorityCandidates': [r for r in candidates if r['family'] in ['Bromeliaceae', 'Myrtaceae', 'Araceae', 'Sapotaceae', 'Annonaceae', 'Clusiaceae', 'Anacardiaceae']],
    })
    existing = {p['scientificName']: p for p in catalog['plants']}
    names = list(dict.fromkeys(NEW + SPLIT + ['Aechmea lingulata']))
    report_file = OUT / 'research.json'
    report = json.loads(report_file.read_text(encoding='utf8')) if report_file.exists() else {}
    for i, name in enumerate(names):
        if report.get(name, {}).get('complete'):
            continue
        row = {'scientificName': name, 'workbookRow': next((r['workbookRow'] for r in candidates if r['species'] == name), None)}
        try:
            cache = ROOT / 'sources/flora' / (name.replace(' ', '_') + '.json')
            if not cache.exists():
                url = 'https://servicos.jbrj.gov.br/v2/flora/taxon/' + name.replace(' ', '_')
                data = json.loads(get(url))
                write(cache, {'url': url, 'retrievedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'data': data})
                time.sleep(1.1)
            payload = json.loads(cache.read_text(encoding='utf8'))
            matches = [r for r in payload['data'] if eligible(r) and binomial(r['taxon']) == name]
            row['eligible'] = bool(matches)
            if matches:
                row['floraId'] = matches[0]['taxon']['taxonid']
                row['attributes'] = matches[0].get('specie_profile')
                row['photos'] = []
                old_photos = [ph for p in catalog['plants'] for ph in p['photos'] if ph['taxonName'] == name]
                row['existingPhotos'] = len(old_photos)
                if len(old_photos) < 2:
                    for license_code in ['cc0', 'cc-by']:
                        params = {'taxon_name': name, 'photo_license': license_code, 'quality_grade': 'research', 'captive': 'false', 'per_page': 8, 'order_by': 'votes'}
                        url = 'https://api.inaturalist.org/v1/observations?' + urllib.parse.urlencode(params)
                        raw = get(url)
                        data = json.loads(raw)
                        write(OUT / (name.replace(' ', '_') + '-' + license_code + '.json'), {'url': url, 'retrievedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'responseSha256': hashlib.sha256(raw).hexdigest(), 'data': data})
                        for obs in data['results']:
                            if obs.get('taxon', {}).get('name') != name or obs.get('quality_grade') != 'research' or obs.get('captive') or obs.get('flags'):
                                continue
                            for ph in obs.get('photos', []):
                                dims = ph.get('original_dimensions') or {}
                                if ph.get('license_code') == license_code and not ph.get('hidden') and not ph.get('flags') and not ph.get('moderator_actions') and min(dims.get('width', 0), dims.get('height', 0)) >= 400:
                                    row['photos'].append({'observationId': obs['id'], 'taxonName': name, 'photoId': ph['id'], 'licenseCode': license_code})
                        row.setdefault('matchingObservations', {})[license_code] = data['total_results']
                        time.sleep(1.1)
                row['complete'] = True
            else:
                row['complete'] = True
                row['reason'] = 'Exact accepted native BR-RJ / Atlantic Forest combination not confirmed; do not add.'
        except Exception as exc:
            row['error'] = str(exc)
        report[name] = row
        write(report_file, report)
        print(f"{i+1}/{len(names)} {name}: eligible={row.get('eligible')} existing={row.get('existingPhotos', 0)} candidates={len(row.get('photos', []))} {row.get('error', '')}", flush=True)
    print('Research saved. No catalog mutations.', flush=True)


if __name__ == '__main__':
    main()
