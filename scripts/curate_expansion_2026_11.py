"""Apply this bounded editorial pass without overwriting subsequent edits.

stage writes sourced species drafts, splitting groups without duplicate members.
finalize promotes only drafts with photos and records a complete before/after audit.
Rerunning stage is refused. Photo imports use the existing verified downloader.
"""
import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from generate_seed import load, eligible, binomial, base
from curate_scope import municipal_index
from expansion_texts_2026_11 import SOURCES, entries

OUT = ROOT / 'sources/expansion-2026-11-11'
CATALOG = ROOT / 'src/data/plants.json'
DATE = '2026-11-11'
REVISION = {
    'title': 'Mattos, Coelho & Baumgratz (2026). Philodendron subg. Philodendron from Rio de Janeiro: diversity and taxonomy. Phytotaxa 752:1–37. Resumo: conflitos com registros antigos.',
    'url': 'https://phytotaxa.mapress.com/pt/article/view/phytotaxa.752.1.1', 'retrievedAt': DATE,
}


def read(path):
    return json.loads(path.read_text(encoding='utf8'))


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')


def source(key, name):
    if key in SOURCES:
        title, url = SOURCES[key]
        return {'title': title, 'url': url, 'retrievedAt': DATE}
    if key.startswith('flora-'):
        payload, records = load(name)
        assert any(eligible(r) and binomial(r['taxon']) == name for r in records), name
        return {'title': f'Flora e Funga do Brasil · {name}. Nome aceito, origem, distribuição e atributos estruturados.',
                'url': payload['url'], 'retrievedAt': payload['retrievedAt']}
    raise ValueError(f'Unresolved botanical source: {key}')


def unique(sources):
    return list({s['url']: s for s in sources}.values())


def ecology(plant):
    habitats = {
        'Floresta Ombrófila (= Floresta Pluvial)': 'florestas úmidas',
        'Floresta Ombrófila Mista': 'florestas com araucária',
        'Floresta Estacional Semidecidual': 'florestas estacionais semideciduais',
        'Floresta Estacional Decidual': 'florestas estacionais deciduais',
        'Vegetação Sobre Afloramentos Rochosos': 'vegetação sobre afloramentos rochosos',
        'Floresta Ciliar ou Galeria': 'matas ciliares ou de galeria',
        'Floresta de Terra Firme': 'florestas de terra firme',
        'Floresta de Várzea': 'florestas de várzea',
        'Campo de Altitude': 'campos de altitude',
        'Campo rupestre': 'campos rupestres',
        'Restinga': 'restingas',
        'Cerrado (lato sensu)': 'Cerrado',
        'Área Antrópica': 'áreas alteradas',
    }
    text = ''
    if plant['habitats']:
        text = 'Ambientes registrados no Brasil: ' + '; '.join(habitats.get(h, h) for h in plant['habitats']) + '. Esses registros não se restringem ao município do Rio. '
    return text + ('O guia reúne documentação municipal nas fontes abaixo; registros históricos não garantem presença atual em cada localidade.' if plant['geography'] == 'rio-city' else 'A ocorrência nativa está confirmada para o estado do Rio de Janeiro. Esta ficha mantém abrangência estadual, sem presumir presença silvestre no município.')


def stage():
    if (OUT / 'stage.json').exists():
        raise ValueError('Stage already applied; preserving subsequent catalog/photo edits.')
    catalog = read(CATALOG)
    before = read(OUT / 'catalog-before.json')
    if catalog != before:
        raise ValueError('Catalog changed since research started. Review and merge explicitly.')
    research = read(OUT / 'research.json')
    municipal = municipal_index(read(ROOT / 'sources/scope-2026-10-24/evidence.json'))
    photos = {ph['photoId']: copy.deepcopy(ph) for p in catalog['plants'] for ph in p['photos']}
    staged, skipped = [], []
    for name, text in entries().items():
        existing = next((p for p in catalog['plants'] if p['rank'] == 'species' and p['scientificName'] == name), None)
        group = next((p for p in catalog['plants'] if p['rank'] == 'genus' and any(s['scientificName'] == name for s in p['regionalSpecies'])), None)
        prior = [ph for ph in photos.values() if ph['taxonName'] == name]
        if not prior and not research.get(name, {}).get('photos'):
            skipped.append({'scientificName': name, 'reason': 'Sem fotografia elegível confirmada nesta rodada; manter a representação anterior, se existente.'})
            continue
        payload, records = load(name)
        match = next((r for r in records if eligible(r) and binomial(r['taxon']) == name), None)
        if match is None:
            skipped.append({'scientificName': name, 'reason': 'Sem confirmação exata de nome aceito, origem nativa, BR-RJ e Mata Atlântica.'})
            continue
        plant = existing or base(name, match, payload)
        action = 'enriched-profile' if existing and existing.get('presentation') != 'checklist' else 'promoted-reference' if existing else 'split-genus' if group else 'new-species'
        if not existing:
            plant['photos'] = copy.deepcopy(prior)
            if group:
                group['regionalSpecies'] = [m for m in group['regionalSpecies'] if m['scientificName'] != name]
                group['photos'] = [ph for ph in group['photos'] if ph['taxonName'] != name]
                # A previous redirect becomes the canonical species ID again.
                group['previousIds'] = [i for i in group.get('previousIds', []) if i != plant['id']]
                for field in ['municipalEvidence', 'regionalEvidence']:
                    plant[field] = [e for e in group.get(field, []) if e['scientificName'] == name]
                    group[field] = [e for e in group.get(field, []) if e['scientificName'] != name]
                plant['sources'] = unique(plant['sources'] + [e['source'] for field in ['municipalEvidence', 'regionalEvidence'] for e in plant.get(field, [])])
                group['reviewStatus'] = 'draft'
            catalog['plants'].append(plant)
        if municipal.get(name) and not plant.get('municipalEvidence'):
            plant['municipalEvidence'] = municipal[name]
        if plant.get('municipalEvidence'):
            plant['geography'] = 'rio-city'
            plant['sources'] = unique(plant['sources'] + [e['source'] for e in plant['municipalEvidence']])
        old_common = plant['commonName']
        if text['commonName']:
            plant['commonName'] = text['commonName']
            if old_common not in [name, plant['commonName']] and old_common not in plant['alternateNames']:
                plant['alternateNames'].append(old_common)
        plant['description'] = text['description']
        plant['identification'] = text['identification']
        plant['ecology'] = ecology(plant)
        plant['reviewStatus'] = 'draft'
        plant['presentation'] = 'checklist'  # Finalization requires actual local photos.
        plant['sources'] = unique(plant['sources'] + [source(k, name) for k in text['sourceKeys']])
        plant['curationNotes'] += ' Rodada de 11/11/2026: texto original e desmembramento editorial em rascunho; nomes e abrangência conferidos no JBRJ. Fotografias iNaturalist são ilustrações, não prova de origem nativa, presença municipal ou comestibilidade. Caracteres de reconhecimento não substituem chave completa. Fotos anteriores mantêm sua revisão; imagens novas exigem revisão humana.'
        staged.append({'id': plant['id'], 'scientificName': name, 'family': plant['family'], 'action': action, 'fromGroup': group['id'] if group else None, 'sourceKeys': text['sourceKeys']})
    catalog['updatedAt'] = DATE
    write(CATALOG, catalog)
    write(OUT / 'stage.json', {'date': DATE, 'staged': staged, 'skipped': skipped})
    write(OUT / 'botanical-sources.json', {k: {'title': v[0], 'url': v[1], 'retrievedAt': DATE} for k, v in SOURCES.items()})
    print(f'{len(staged)} species drafts staged; {len(skipped)} deferred.')


def finalize():
    catalog = read(CATALOG)
    manifest = read(OUT / 'stage.json')
    baseline = read(OUT / 'catalog-before.json')
    texts = entries()
    qa = read(OUT / 'visual-qa.json')
    excluded = {r['photoId'] for r in qa['excludedPhotos']}
    original_ids = {ph['photoId'] for p in baseline['plants'] for ph in p['photos']}
    assert not excluded & original_ids, 'Visual QA cannot remove previously reviewed/acquired photos'
    for plant in catalog['plants']:
        plant['photos'] = [ph for ph in plant['photos'] if ph['photoId'] not in excluded]
        first = qa['firstPhoto'].get(plant['id'])
        if first:
            chosen = next(ph for ph in plant['photos'] if ph['photoId'] == first)
            plant['photos'] = [chosen] + [ph for ph in plant['photos'] if ph['photoId'] != first]
    for row in manifest['staged']:
        plant = next(p for p in catalog['plants'] if p['id'] == row['id'])
        text = texts[row['scientificName']]
        plant['description'] = text['description']
        plant['identification'] = text['identification']
        plant['sources'] = unique(plant['sources'] + [source(k, plant['scientificName']) for k in text['sourceKeys']])
        row['sourceKeys'] = text['sourceKeys']
        plant['presentation'] = 'profile' if plant['photos'] else 'checklist'
        if plant['id'] in qa['referenceOnly']:
            plant['presentation'] = 'checklist'
            row['referenceReason'] = qa['referenceOnly'][plant['id']]
        row['presentation'] = plant['presentation']
        row['photoIds'] = [p['photoId'] for p in plant['photos']]
        row['geography'] = plant['geography']
        row['sources'] = plant['sources']
    for group in catalog['plants']:
        if group['rank'] != 'genus' or not any(r['fromGroup'] == group['id'] for r in manifest['staged']):
            continue
        members = group['regionalSpecies']
        terrestrial = sum('Terrícola' in m['substrates'] for m in members)
        group['description'] = f"Esta entrada reúne {len(members)} espécies de {group['genus']} sem ficha individual neste guia; {terrestrial} têm substrato terrícola registrado. Contagens estaduais derivadas dos membros enumerados, com base na Flora e Funga consultada em outubro de 2026 e seleção reorganizada em 11/11/2026. Não são contagens municipais nem um inventário completo do gênero. As demais espécies representadas têm fichas próprias na lista de espécies."
        shown = sorted({ph['taxonName'] for ph in group['photos']})
        group['identification'] = ('A galeria ilustra somente ' + ', '.join(shown) + '. ' if shown else 'Esta entrada de referência ainda não tem galeria própria. ') + 'Cada membro deve ser comparado individualmente com uma chave botânica; a forma das folhas, sozinha, não confirma todas as espécies. As fichas desmembradas podem ser encontradas pelo nome na lista de espécies.'
        group['presentation'] = 'profile' if shown else 'checklist'
        group['reviewStatus'] = 'draft'
        note = ' Reorganizado em 11/11/2026, preservando IDs, membros remanescentes e evidências vinculadas a cada espécie. Textos, fotos e evidências dos membros desmembrados foram transferidos para suas fichas.'
        if note not in group['curationNotes']:
            group['curationNotes'] += note
        if group['genus'] == 'Philodendron':
            group['description'] += ' A revisão de Mattos et al. (2026) exclui P. acutatum e P. curvilobum da flora estadual e considera P. imbe duvidoso. Esses nomes foram preservados da seleção anterior para rastreabilidade; sua inclusão regional está pendente de conciliação taxonômica e não é reafirmada aqui.'
            note = ' Conflito explícito com revisão de 2026; não desmembrar acutatum, curvilobum ou imbe como novas fichas confirmadas. O resumo não foi usado para inferir outras exclusões ou sinonímias.'
            if note not in group['curationNotes']:
                group['curationNotes'] += note
            group['sources'] = unique(group['sources'] + [REVISION])
    old_names = {m['scientificName'] for p in baseline['plants'] for m in (p['regionalSpecies'] if p['rank'] == 'genus' else [p])}
    new_names = {m['scientificName'] for p in catalog['plants'] for m in (p['regionalSpecies'] if p['rank'] == 'genus' else [p])}
    assert old_names <= new_names
    old_photos = {ph['photoId']: ph for p in baseline['plants'] for ph in p['photos']}
    new_photos = {ph['photoId']: ph for p in catalog['plants'] for ph in p['photos']}
    assert all(new_photos.get(i) == ph for i, ph in old_photos.items()), 'Existing photo metadata changed'
    catalog['updatedAt'] = DATE
    write(CATALOG, catalog)
    manifest['summary'] = {
        'before': {'entries': len(baseline['plants']), 'profiles': sum(p.get('presentation') != 'checklist' for p in baseline['plants']), 'species': len(old_names), 'photos': len(old_photos)},
        'after': {'entries': len(catalog['plants']), 'profiles': sum(p.get('presentation') != 'checklist' for p in catalog['plants']), 'species': len(new_names), 'photos': len(new_photos)},
        'newSpecies': sorted(new_names - old_names),
        'newPhotoIds': sorted(set(new_photos) - set(old_photos)),
        'sourceWorkbookSha256': read(OUT / 'workbook-index.json')['sha256'],
        'catalogSha256': hashlib.sha256(CATALOG.read_bytes()).hexdigest(),
    }
    write(OUT / 'curation.json', manifest)
    write(OUT / 'botanical-sources.json', {k: {'title': v[0], 'url': v[1], 'retrievedAt': DATE} for k, v in SOURCES.items()})
    print(json.dumps(manifest['summary'], ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['stage', 'finalize'])
    args = parser.parse_args()
    stage() if args.command == 'stage' else finalize()
