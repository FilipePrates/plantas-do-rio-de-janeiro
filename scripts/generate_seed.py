"""Create a new draft from cached official records, without replacing edits.

Usage: python3 scripts/generate_seed.py /tmp/new-plants.json
The generated descriptions summarize structured botanical facts. They are not
copied taxonomic descriptions, field identification keys, or reviewed text.
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMON = {
    'Eugenia uniflora': 'Pitanga', 'Eugenia brasiliensis': 'Grumixama',
    'Eugenia involucrata': 'Cereja-do-rio-grande', 'Eugenia sulcata': 'Pitanga-preta',
    'Eugenia neonitida': 'Pitanga-da-restinga', 'Eugenia copacabanensis': 'Eugênia-de-copacabana',
    'Plinia edulis': 'Cambucá', 'Plinia cauliflora': 'Jabuticaba',
    'Campomanesia phaea': 'Cambuci', 'Campomanesia xanthocarpa': 'Guabiroba',
    'Psidium cattleyanum': 'Araçá', 'Psidium guineense': 'Araçá-do-campo',
    'Alcantarea glaziouana': 'Bromélia-do-pão-de-açúcar', 'Alcantarea imperialis': 'Bromélia-imperial',
    'Aechmea fasciata': 'Bromélia-vaso-prateado', 'Bromelia antiacantha': 'Gravatá',
    'Tillandsia usneoides': 'Barba-de-velho', 'Tillandsia stricta': 'Cravo-do-mato',
    'Neoregelia cruenta': 'Bromélia-da-restinga', 'Euterpe edulis': 'Palmito-juçara',
    'Syagrus romanzoffiana': 'Jerivá', 'Syagrus weddelliana': 'Palmeira-weddell',
    'Attalea humilis': 'Pindoba', 'Attalea dubia': 'Indaiá', 'Bactris setosa': 'Tucum',
    'Astrocaryum aculeatissimum': 'Brejaúva', 'Allagoptera arenaria': 'Guriri',
    'Acrocomia aculeata': 'Macaúba', 'Geonoma schottiana': 'Guaricanga',
    'Cariniana legalis': 'Jequitibá-rosa', 'Cariniana estrellensis': 'Jequitibá-branco',
    'Cariniana ianeirensis': 'Jequitibá-do-rio', 'Lecythis pisonis': 'Sapucaia',
    'Lecythis lanceolata': 'Sapucaia-mirim', 'Paubrasilia echinata': 'Pau-brasil',
    'Cenostigma pluviosum': 'Sibipiruna', 'Schizolobium parahyba': 'Guapuruvu',
    'Piptadenia gonoacantha': 'Pau-jacaré', 'Anadenanthera colubrina': 'Angico',
    'Inga edulis': 'Ingá-cipó', 'Inga laurina': 'Ingá-branco', 'Inga marginata': 'Ingá-feijão',
    'Copaifera langsdorffii': 'Copaíba', 'Libidibia ferrea': 'Pau-ferro',
    'Erythrina speciosa': 'Mulungu-do-litoral', 'Erythrina falcata': 'Corticeira',
    'Senna multijuga': 'Pau-cigarra', 'Dalbergia nigra': 'Jacarandá-da-bahia',
    'Enterolobium contortisiliquum': 'Tamboril', 'Peltophorum dubium': 'Canafístula',
    'Handroanthus heptaphyllus': 'Ipê-roxo', 'Handroanthus chrysotrichus': 'Ipê-amarelo',
    'Handroanthus serratifolius': 'Ipê-amarelo-da-mata', 'Tabebuia roseoalba': 'Ipê-branco',
    'Jacaranda puberula': 'Carobinha', 'Sparattosperma leucanthum': 'Cinco-folhas',
    'Pleroma granulosum': 'Quaresmeira', 'Pleroma mutabile': 'Manacá-da-serra',
    'Miconia cinnamomifolia': 'Jacatirão', 'Ficus insipida': 'Figueira-branca',
    'Ficus cyclophylla': 'Figueira-de-folha-larga', 'Cecropia pachystachya': 'Embaúba',
    'Cecropia glaziovii': 'Embaúba-vermelha', 'Cecropia hololeuca': 'Embaúba-prateada',
    'Urera baccifera': 'Urtigão', 'Ocotea odorifera': 'Canela-sassafrás',
    'Schinus terebinthifolia': 'Aroeira-vermelha', 'Tapirira guianensis': 'Cupiúba',
    'Spondias venulosa': 'Cajá-do-mato', 'Manilkara subsericea': 'Maçaranduba',
    'Genipa americana': 'Jenipapo', 'Psychotria nuda': 'Erva-de-rato',
    'Clusia fluminensis': 'Clúsia', 'Clusia hilariana': 'Clúsia-da-restinga',
    'Ceiba speciosa': 'Paineira', 'Pseudobombax grandiflorum': 'Embiruçu',
    'Luehea divaricata': 'Açoita-cavalo', 'Heliconia farinosa': 'Bananeirinha-do-mato',
    'Heliconia spathocircinata': 'Helicônia', 'Sinningia speciosa': 'Gloxínia',
    'Passiflora alata': 'Maracujá-doce', 'Passiflora mucronata': 'Maracujá-da-restinga',
    'Passiflora edulis': 'Maracujá', 'Cereus fernambucensis': 'Mandacaru-da-restinga',
    'Rhipsalis baccifera': 'Cacto-macarrão', 'Rhipsalis teres': 'Ripsális',
    'Ipomoea pes-caprae': 'Salsa-da-praia', 'Ipomoea imperati': 'Salsa-branca-da-praia',
    'Dicksonia sellowiana': 'Xaxim', 'Cyathea corcovadensis': 'Samambaiaçu-do-corcovado',
}
MUNICIPAL = 'https://www.rio.rj.gov.br/dlstatic/10112/4571912/4115297/RESSMAC4922011invasoras.pdf'
INVASIVES = {
    'Leucaena leucocephala': ('Leucena', 'Fabaceae', 'Árvore ou arbusto com folhas compostas, inflorescências globosas claras e vagens achatadas.', MUNICIPAL),
    'Epipremnum aureum': ('Jiboia', 'Araceae', 'Arácea trepadora com raízes aderentes. As folhas juvenis e adultas podem ter aspecto muito diferente; as adultas podem apresentar recortes.', 'https://www.gov.br/jbrj/pt-br/assuntos/educacao/livro-de-resumos_pibic-2024_-versao-final-1-2.pdf'),
    'Tradescantia zebrina': ('Zebrina', 'Commelinaceae', 'Erva rastejante com folhas frequentemente marcadas por faixas prateadas e face inferior arroxeada.', MUNICIPAL),
    'Artocarpus heterophyllus': ('Jaqueira', 'Moraceae', 'Árvore de folhas simples, com látex e grandes frutos compostos formados no tronco e nos ramos.', MUNICIPAL),
    'Megathyrsus maximus': ('Capim-colonião', 'Poaceae', 'Gramínea que forma touceiras altas, com inflorescências abertas e ramificadas.', MUNICIPAL),
}

def load(name):
    path = ROOT / 'sources/flora' / (name.replace(' ', '_') + '.json')
    if not path.exists():
        return None, []
    payload = json.loads(path.read_text())
    return payload, payload['data']

def binomial(taxon):
    return taxon['genus'] + ' ' + taxon['specificepithet']

def eligible(record):
    t = record.get('taxon', {})
    return t.get('taxonrank') == 'ESPECIE' and t.get('taxonomicstatus') == 'NOME_ACEITO' and any(
        dist.get('locationid') == 'BR-RJ' and dist.get('establishmentmeans') == 'Nativa'
        and 'Mata Atlântica' in dist.get('occurrenceremarks', {}).get('phytogeographicDomain', [])
        for dist in record.get('distribuition', []))

def base(name, record, payload):
    t = record['taxon']; profile = record.get('specie_profile') or {}
    names = [row['vernacularname'] for row in record.get('vernacular_name', []) if row.get('language_vernacularname') == 'PORTUGUES']
    names = list(dict.fromkeys(n.strip() for n in names if n.strip()))
    local_names = [row['vernacularname'] for row in record.get('vernacular_name', []) if 'RJ' in (row.get('locality_vernacularname') or '') and row.get('language_vernacularname') == 'PORTUGUES']
    preferred = COMMON.get(name) or (local_names + names + [name])[0]
    return {
        'id': name.lower().replace(' ', '-'), 'scientificName': name, 'authorship': t.get('scientificnameauthorship') or '',
        'commonName': preferred, 'alternateNames': [n for n in names if n.casefold() != preferred.casefold()],
        'family': t['family'], 'genus': t['genus'], 'rank': 'species', 'origin': 'native', 'geography': 'rio-state',
        'reviewStatus': 'draft', 'description': '', 'identification': '', 'ecology': '',
        'lifeForms': profile.get('lifeForm') or [], 'substrates': profile.get('habitat') or [], 'habitats': profile.get('vegetationType') or [],
        'floraId': t['taxonid'], 'regionalSpecies': [], 'photos': [],
        'sources': [{'title': f'Flora e Funga do Brasil · {name} (FB{t["taxonid"]})', 'url': payload['url'], 'retrievedAt': payload['retrievedAt']}],
        'curationNotes': 'Rascunho gerado de atributos estruturados do JBRJ. Nome popular, texto de campo e recorte municipal precisam de revisão. O registro estadual não comprova ocorrência no município.'
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--allow-missing-groups', action='store_true', help='Generate species drafts while the genus download is pending.')
    args = parser.parse_args()
    if args.output.exists():
        parser.error('O arquivo de saída já existe; escolha um novo caminho para preservar edições.')
    selection = json.loads((ROOT / 'scripts/seed-selection.json').read_text())
    plants, rejected = [], []
    dates = []
    for candidates in selection.values():
        for name in candidates:
            payload, records = load(name)
            match = next((r for r in records if eligible(r) and binomial(r['taxon']) == name), None)
            if not match:
                rejected.append({'name': name, 'reason': 'Sem combinação confirmada de nome aceito, espécie nativa, BR-RJ e Mata Atlântica no cache consultado.'})
                continue
            plant = base(name, match, payload)
            form = ', '.join(plant['lifeForms']).lower() or 'planta'
            plant['description'] = f'{plant["commonName"]} ({name}) pertence à família {plant["family"]}. A Flora e Funga do Brasil registra a espécie como nativa no estado do Rio de Janeiro e no domínio da Mata Atlântica. Forma de vida registrada: {form}.'
            plant['ecology'] = ('Ambientes registrados na fonte para a distribuição brasileira: ' + '; '.join(plant['habitats']) + '.') if plant['habitats'] else ''
            plants.append(plant); dates.append(payload['retrievedAt'])
    for genus, common in [('Anthurium', 'Antúrios nativos'), ('Philodendron', 'Filodendros nativos')]:
        payload, records = load(genus)
        members = {binomial(r['taxon']): r for r in records if eligible(r)}
        if not members:
            if args.allow_missing_groups:
                continue
            raise RuntimeError(f'Não foi possível calcular os membros regionais de {genus}.')
        sample = next(iter(members.values()))
        plant = base(genus + ' spp.', sample, payload)
        plant.update({'id': genus.lower() + '-spp', 'scientificName': genus + ' spp.', 'authorship': '', 'commonName': common, 'alternateNames': ['Antúrio'] if genus == 'Anthurium' else ['Filodendro', 'Imbé'], 'rank': 'genus', 'floraId': None})
        plant['regionalSpecies'] = [{'scientificName': name, 'floraId': r['taxon']['taxonid'], 'lifeForms': (r.get('specie_profile') or {}).get('lifeForm') or [], 'substrates': (r.get('specie_profile') or {}).get('habitat') or []} for name, r in sorted(members.items())]
        plant['lifeForms'] = sorted({v for r in members.values() for v in (r.get('specie_profile') or {}).get('lifeForm') or []})
        plant['substrates'] = sorted({v for r in members.values() for v in (r.get('specie_profile') or {}).get('habitat') or []})
        plant['habitats'] = sorted({v for r in members.values() for v in (r.get('specie_profile') or {}).get('vegetationType') or []})
        terrestrial = sum('Terrícola' in s['substrates'] for s in plant['regionalSpecies'])
        plant['description'] = f'Este grupo reúne {len(members)} espécies aceitas de {genus} registradas como nativas no estado do Rio de Janeiro e no domínio da Mata Atlântica na consulta à Flora e Funga do Brasil. Destas, {terrestrial} têm hábito terrícola registrado. A contagem é estadual, não municipal, e depende da versão consultada.'
        plant['identification'] = 'Aráceas com inflorescência formada por uma espiga (espádice), associada a uma espata. A separação das espécies exige caracteres adicionais; esta ficha não permite identificar todas as espécies do gênero.'
        plant['ecology'] = 'O grupo não se limita a plantas de chão. Substratos registrados: ' + '; '.join(plant['substrates']) + '. Observe a posição da planta no ambiente ao comparar exemplares.'
        plant['sources'] = [{'title': f'Flora e Funga do Brasil · {genus} · nomes aceitos, BR-RJ, nativas, Mata Atlântica', 'url': payload['url'], 'retrievedAt': payload['retrievedAt']}]
        plants.append(plant); dates.append(payload['retrievedAt'])
    for name, (common, family, identification, source) in INVASIVES.items():
        payload, records = load(name)
        match = next((r for r in records if r.get('taxon', {}).get('taxonrank') == 'ESPECIE' and r['taxon'].get('taxonomicstatus') == 'NOME_ACEITO' and binomial(r['taxon']) == name), None)
        if match:
            plant = base(name, match, payload)
        else:
            now = max(dates)
            plant = base(name, {'taxon': {'family': family, 'genus': name.split()[0], 'taxonid': 0}}, {'url': source, 'retrievedAt': now})
            plant['floraId'] = None; plant['sources'] = []
        plant.update({'commonName': common, 'origin': 'invasive', 'geography': 'rio-city', 'description': f'{common} ({name}) é incluída neste guia como exótica invasora para reconhecimento em campo. A seleção das cinco invasoras é editorial e não representa um ranking de abundância ou impacto.', 'identification': identification})
        plant['sources'].append({'title': 'Lista municipal de invasoras · Resolução SMAC 492/2011' if source == MUNICIPAL else 'JBRJ · Pesquisa sobre Epipremnum aureum · PIBIC 2024', 'url': source, 'retrievedAt': max(dates)})
        plant['curationNotes'] = 'Revisar descrição e identificação. Fonte municipal usa nomes históricos para algumas espécies; o nome exibido segue o tratamento atual quando confirmado no JBRJ.'
        if name == 'Epipremnum aureum':
            plant['curationNotes'] += ' Não confundir com Epipremnum pinnatum: documentos municipais usam esse outro nome para jiboia. A publicação do JBRJ informa invasividade geral e estudo no arboreto, não comprova invasão em mata nativa municipal. Confirmar evidência local antes de marcar como revisada.'
        if name == 'Megathyrsus maximus': plant['alternateNames'] += ['Panicum maximum', 'Capim-guiné']
        if name == 'Artocarpus heterophyllus': plant['alternateNames'] += ['Artocarpus integrifolia']
        plants.append(plant)
    plants.sort(key=lambda p: (p['family'], p['scientificName']))
    catalog = {'schemaVersion': 1, 'title': 'Plantas do Rio de Janeiro', 'updatedAt': max(dates), 'maxSpecies': 1500, 'scope': 'Flora nativa do município do Rio de Janeiro, com extensão estadual explicitamente identificada, e cinco invasoras selecionadas. Mata Atlântica, incluindo restinga, afloramentos e florestas.', 'plants': plants}
    args.output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'sources/seed-rejections.json').write_text(json.dumps(rejected, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(plants)} fichas; {len(rejected)} candidatas excluídas por falta de confirmação no recorte.')
