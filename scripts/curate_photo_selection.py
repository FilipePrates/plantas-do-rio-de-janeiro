"""Prepare/finalize one image-led pass; preserve all previous content and photos.

The supplied XLSX is the authority for Rio state (user instruction). No additional
state-occurrence lookup is performed. Drafts/imports are separate from canonical
data until finalization. Refuse stale baselines and more than 10 MiB new media.
"""
import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from prepare_scope import read_workbook
from generate_seed import load, binomial, base
from curate_expansion_2026_11 import ecology
from photo_selection_texts import SOURCES, NEW_PHOTOS, FIRST_PHOTO, entries

OUT = ROOT / 'sources/photo-selection-2026-11-11'
CANONICAL = ROOT / 'src/data/plants.json'
WORKBOOK = ROOT / 'docs/Arvores_Arbustos_Nativos_RJ.xlsx'
DATE = '2026-11-11'
LIMIT = 10 * 1024 * 1024
VEGETATION = {
    'Rainforest': 'Floresta Ombrófila (= Floresta Pluvial)',
    'Restinga': 'Restinga', 'Anthropic_Area': 'Área Antrópica',
    'Gallery_Forest': 'Floresta Ciliar ou Galeria',
    'Inundated_Forest': 'Floresta de Várzea',
    'Mixed_Ombrophyllous_Forest': 'Floresta Ombrófila Mista',
    'Seasonally_Semideciduous_Forest': 'Floresta Estacional Semidecidual',
    'Terra_Firme_Forest': 'Floresta de Terra Firme',
    'Cerrado': 'Cerrado (lato sensu)', 'Grassland': 'Campo Limpo',
    'Highland_Rocky_Field': 'Campo rupestre',
    'Rock_Outcrop_Vegetation': 'Vegetação Sobre Afloramentos Rochosos',
}

def read(path):
    return json.loads(path.read_text(encoding='utf8'))

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

def names(c):
    return {m['scientificName'] for p in c['plants'] for m in (p['regionalSpecies'] if p['rank'] == 'genus' else [p])}

def photos(c):
    return {ph['photoId']: ph for p in c['plants'] for ph in p['photos']}

def summary(c):
    return dict(entries=len(c['plants']), species=len(names(c)), profiles=sum(p.get('presentation') != 'checklist' for p in c['plants']), photos=len(photos(c)))

def prepare():
    assert not (OUT / 'drafts.json').exists(), 'Drafts already prepared; do not overwrite imports.'
    original = read(CANONICAL)
    assert original == read(OUT / 'catalog-before.json'), 'Baseline changed; merge explicitly.'
    rows = {r['species']: r for r in read_workbook(WORKBOOK)}
    survey = read(OUT / 'photo-survey.json')
    drafts = copy.deepcopy(original)
    actions = []
    for name, text in entries().items():
        plant = next((p for p in drafts['plants'] if p['scientificName'] == name), None)
        row = rows.get(name)
        if plant is None:
            assert row and name in NEW_PHOTOS and name not in names(original), name
            # Reuse already-cached structural attributes when present, without a
            # new geographic eligibility query. The workbook supplies state scope.
            payload, records = load(name)
            match = next((r for r in records if r.get('taxon', {}).get('taxonrank') == 'ESPECIE' and binomial(r['taxon']) == name), None)
            if match:
                plant = base(name, match, payload)
            else:
                plant = dict(id=name.lower().replace(' ', '-'), scientificName=name, authorship='', commonName=name, alternateNames=[], family=row['family'], genus=row['genus'], rank='species', origin='native', geography='rio-state', reviewStatus='draft', description='', identification='', ecology='', lifeForms=[{'Tree': 'Árvore', 'Shrub': 'Arbusto', 'Subshrub': 'Subarbusto'}.get(v, v) for v in row['lifeForm'].split(';') if v], substrates=['Terrícola'], habitats=[], floraId=None, regionalSpecies=[], photos=[], sources=[], curationNotes='')
            plant['geography'] = 'rio-state'
            drafts['plants'].append(plant)
        else:
            assert plant['presentation'] == 'checklist' and plant['photos'], name
        action = 'new-species' if name in NEW_PHOTOS else 'promoted-reference'
        if text['commonName']:
            if plant['commonName'] not in [name, text['commonName']] and plant['commonName'] not in plant['alternateNames']:
                plant['alternateNames'].append(plant['commonName'])
            plant['commonName'] = text['commonName']
        for field in ['description', 'identification']:
            plant[field] = text[field]
        plant['ecology'] = ecology(plant)
        plant['reviewStatus'] = 'draft'
        plant['presentation'] = 'profile'
        added = [dict(title=SOURCES[k][0], url=SOURCES[k][1], retrievedAt=DATE) for k in text['sourceKeys']]
        plant['sources'] = list({s['url']: s for s in plant['sources'] + added}.values())
        plant['curationNotes'] += f" Seleção visual de 11/11/2026: texto original em rascunho; fotos ilustram a espécie, sem inferir ocorrência municipal ou comestibilidade. "
        if action == 'new-species':
            plant['curationNotes'] += f"Abrangência estadual adotada da planilha fornecida Arvores_Arbustos_Nativos_RJ.xlsx, linha {row['workbookRow']}, conforme orientação do usuário; não houve nova checagem de ocorrência no Rio. "
        first = FIRST_PHOTO.get(name)
        if first:
            assert first in {p['photoId'] for p in plant['photos']}, name
            plant['photos'].sort(key=lambda p: p['photoId'] != first)
        tasks = []
        for photo_id in NEW_PHOTOS.get(name, []):
            selected = next(p for p in survey[name]['photos'] if p['photo']['id'] == photo_id)
            tasks.append(dict(photoId=photo_id, observationId=selected['observationId']))
        actions.append(dict(id=plant['id'], scientificName=name, action=action, workbookRow=row['workbookRow'] if row else None, sources=added, selectedPhotos=tasks))
    write(OUT / 'drafts.json', drafts)
    write(OUT / 'selection.json', dict(date=DATE, mediaBudgetBytes=LIMIT, workbookSha256=hashlib.sha256(WORKBOOK.read_bytes()).hexdigest(), actions=actions, deferred={n: 'Sem imagem elegível ou conjunto visual menos convincente que a seleção; nenhum novo arquivo incorporado.' for n in survey if n not in NEW_PHOTOS}, review='All new text/photos remain draft; photo markers remain unknown. Existing photo objects preserved exactly.'))
    print(f'{len(actions)} drafts prepared separately; canonical catalog unchanged.')

def finalize():
    assert not (OUT / 'audit.json').exists(), 'Pass already finalized.'
    baseline = read(OUT / 'catalog-before.json')
    assert read(CANONICAL) == baseline, 'Concurrent catalog change; merge explicitly.'
    catalog = read(OUT / 'drafts.json')
    selection = read(OUT / 'selection.json')
    rows = {r['species']: r for r in read_workbook(WORKBOOK)}
    previous = photos(baseline)
    current = photos(catalog)
    assert names(baseline) <= names(catalog)
    assert all(current.get(i) == ph for i, ph in previous.items()), 'Existing photo metadata changed.'
    new_ids = set(current) - set(previous)
    wanted = {r['photoId'] for a in selection['actions'] for r in a['selectedPhotos']}
    assert new_ids == wanted, (new_ids, wanted)
    media_bytes = 0
    for photo_id in new_ids:
        ph = current[photo_id]
        assert ph['reviewStatus'] == 'draft' and ph['markers'] == ['unknown']
        payload = (ROOT / 'assets/plants' / ph['fileName']).read_bytes()
        assert hashlib.sha256(payload).hexdigest() == ph['sha256']
        media_bytes += len(payload)
    assert media_bytes <= LIMIT, f'New images exceed 10 MiB budget: {media_bytes}'
    for action in selection['actions']:
        p = next(p for p in catalog['plants'] if p['id'] == action['id'])
        assert p['photos'] and p['reviewStatus'] == 'draft' and p['identification']
        if action['selectedPhotos']:
            order = [r['photoId'] for r in action['selectedPhotos']]
            p['photos'].sort(key=lambda ph: order.index(ph['photoId']))
            assert p['geography'] == 'rio-state'
            # These are the workbook's Brazil-wide habitat attributes, not new
            # inferences about where a Rio photo was taken.
            row = rows[p['scientificName']]
            if not p['habitats']:
                p['habitats'] = [VEGETATION[v] for v in row['vegetation'].split(';') if v and v != 'Unknown']
            p['ecology'] = ecology(p)
        action['photoIds'] = [ph['photoId'] for ph in p['photos']]
    assert hashlib.sha256(WORKBOOK.read_bytes()).hexdigest() == selection['workbookSha256']
    catalog['plants'].sort(key=lambda p: (p['family'], p['scientificName']))
    catalog['updatedAt'] = DATE
    write(CANONICAL, catalog)
    audit = dict(**selection, before=summary(baseline), after=summary(catalog), newMediaBytes=media_bytes, newPhotoIds=sorted(new_ids), newSpecies=sorted(names(catalog) - names(baseline)), catalogSha256=hashlib.sha256(CANONICAL.read_bytes()).hexdigest())
    write(OUT / 'audit.json', audit)
    write(ROOT / 'docs/photo-selection-2026-11-11.json', audit)
    print(json.dumps({k: audit[k] for k in ['before', 'after', 'newMediaBytes']}, indent=2))

def refresh_sources():
    """Apply verified bibliographic titles without rerunning the content pass."""
    mapping = {SOURCES[k][1]: SOURCES[k][0] for k in ['solanum', 'carpotroche', 'byrsonima']}
    def visit(value):
        if isinstance(value, dict):
            if value.get('url') in mapping and 'title' in value:
                value['title'] = mapping[value['url']]
            for item in value.values():
                visit(item)
        elif isinstance(value, list):
            for item in value:
                visit(item)
    for path in [CANONICAL, OUT/'drafts.json', OUT/'selection.json', OUT/'audit.json', ROOT/'docs/photo-selection-2026-11-11.json']:
        value = read(path)
        visit(value)
        if 'plants' in value:
            plant = next(p for p in value['plants'] if p['scientificName'] == 'Stifftia fruticosa')
            plant['commonName'] = entries()['Stifftia fruticosa']['commonName']
            title, url = SOURCES['stifftia-names']
            if not any(s['url'] == url for s in plant['sources']):
                plant['sources'].append(dict(title=title, url=url, retrievedAt=DATE))
        if 'actions' in value:
            action = next(a for a in value['actions'] if a['scientificName'] == 'Stifftia fruticosa')
            title, url = SOURCES['stifftia-names']
            if not any(s['url'] == url for s in action['sources']):
                action['sources'].append(dict(title=title, url=url, retrievedAt=DATE))
        write(path, value)
    digest = hashlib.sha256(CANONICAL.read_bytes()).hexdigest()
    for path in [OUT/'audit.json', ROOT/'docs/photo-selection-2026-11-11.json']:
        value = read(path)
        value['catalogSha256'] = digest
        write(path, value)
    print(f'Verified bibliography titles synchronized; catalog SHA256 {digest}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['prepare', 'finalize', 'refresh-sources'])
    args = parser.parse_args()
    globals()[args.command.replace('-', '_')]()
