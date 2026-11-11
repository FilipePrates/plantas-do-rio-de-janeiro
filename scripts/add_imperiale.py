"""Add the requested, source-backed tree and one visually inspected CC0 photo."""
import copy
import hashlib
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'sources/imperiale-2026-11-11'
CATALOG = ROOT / 'src/data/plants.json'

def read(path):
    return json.loads(path.read_text(encoding='utf8'))

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

catalog = read(CATALOG)
assert not any(p['scientificName'] in ['Martiusella imperialis', 'Chrysophyllum imperiale'] or
               any(m['scientificName'] in ['Martiusella imperialis', 'Chrysophyllum imperiale'] for m in p['regionalSpecies'])
               for p in catalog['plants']), 'Tree already represented; preserve edits.'
assert not (OUT/'catalog-before.json').exists(), 'This curation has already started.'
write(OUT/'catalog-before.json', catalog)
before = copy.deepcopy(catalog)
now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
flora = read(ROOT/'sources/flora/Martiusella_imperialis.json')['data'][0]
assert flora['taxon']['taxonomicstatus'] == 'NOME_ACEITO'
synonym = read(ROOT/'sources/flora/Chrysophyllum_imperiale.json')['data'][0]
assert synonym['taxon']['acceptednameusageid'] == flora['taxon']['taxonid']

observation = next(o for o in read(OUT/'inat-cc0.json')['results'] if o['id'] == 232543995)
photo = next(p for p in observation['photos'] if p['id'] == 413138563)
assert observation['quality_grade'] == 'research' and observation['captive'] is False
assert observation['taxon']['name'] == 'Chrysophyllum imperiale'
assert photo['license_code'] == 'cc0' and not photo.get('hidden') and not photo.get('flags')
payload = (ROOT/'backups/imperiale-2026-11-11/inat-413138563.jpg').read_bytes()
digest = hashlib.sha256(payload).hexdigest()
filename = 'inat-413138563.jpg'
destination = ROOT/'assets/plants'/filename
evidence_path = ROOT/'sources/inaturalist/photos/413138563.json'
assert not destination.exists() and not evidence_path.exists(), 'Do not overwrite acquired media/evidence.'
source_url = photo['url'].replace('/square.', '/large.')
creator = observation['user'].get('name') or observation['user']['login']
evidence = dict(
    apiUrl='https://api.inaturalist.org/v1/observations/232543995', photo=photo, creator=creator,
    observation=dict(id=observation['id'], quality_grade=observation['quality_grade'],
                     taxon=dict(id=observation['taxon']['id'], name=observation['taxon']['name']),
                     observerLogin=observation['user']['login']),
    download=dict(url=source_url, sha256=digest, retrievedAt=now),
)
entry = dict(
    id='martiusella-imperialis', scientificName='Martiusella imperialis',
    authorship=flora['taxon']['scientificnameauthorship'], commonName='Árvore-do-imperador',
    alternateNames=['Chrysophyllum imperiale', 'Guapeba', 'Guapeba-preta', 'Marmeleiro-do-mato', 'Fruta-do-imperador'],
    family='Sapotaceae', genus='Martiusella', rank='species', origin='native', geography='rio-state',
    reviewStatus='draft', presentation='profile', floraId=flora['taxon']['taxonid'], regionalSpecies=[],
    description='Árvore da Mata Atlântica conhecida pelas folhas grandes e alongadas, de consistência firme e margem serrilhada. As folhas novas podem apresentar tons prateados ou dourados. O tronco tem casca escura e fissurada, e os frutos são carnosos. É também muito conhecida pelo nome científico Chrysophyllum imperiale, hoje tratado como sinônimo de Martiusella imperialis.',
    identification='Observe o conjunto formado pelas folhas grandes, a margem com pequenos dentes pontiagudos e as nervuras laterais bem marcadas. As folhas se distribuem em espiral nos ramos. As flores são pequenas e esverdeadas, próximas aos ramos; as sementes são duras e achatadas. Em indivíduos jovens, a folhagem pode ser mais chamativa que o caule. Folhas grandes isoladas não bastam para confirmar a espécie.',
    ecology='Espécie nativa da Mata Atlântica, associada a florestas úmidas. A avaliação do CNCFlora de 2019, publicada sob o nome Chrysophyllum imperiale, destacou populações esparsas, perda de habitat e exploração histórica da madeira, classificando-a como Em Perigo (EN). Há também exemplares cultivados em jardins botânicos. A fotografia desta ficha ilustra um indivíduo jovem e não comprova ocorrência no município do Rio.',
    lifeForms=['Árvore'], substrates=['Terrícola'], habitats=flora['specie_profile']['vegetationType'],
    photos=[dict(
        id='inat-413138563', fileName=filename, photoId=photo['id'], observationId=observation['id'],
        taxonId=observation['taxon']['id'], taxonName=observation['taxon']['name'], creator=creator,
        license='CC0-1.0', licenseCode='cc0', sourceUrl=source_url,
        observationUrl='https://www.inaturalist.org/observations/232543995', downloadedAt=now, sha256=digest,
        markers=['wholePlant', 'leaf'],
        caption='Indivíduo jovem no sub-bosque, com caule delgado e folhas grandes de nervuras laterais marcadas.',
        reviewStatus='draft',
    )],
    sources=[
        dict(title='Flora e Funga do Brasil — Martiusella imperialis: nome aceito, sinonímia e ambientes.',
             url='https://servicos.jbrj.gov.br/v2/flora/taxon/Martiusella_imperialis', retrievedAt='2026-11-11'),
        dict(title='Museu Nacional/UFRJ, Projeto Glaziou — Chrysophyllum imperiale: morfologia e nomes populares.',
             url='https://www.museunacional.ufrj.br/glaziou/pagina_11.html', retrievedAt='2026-11-11'),
        dict(title='Fernandez & Moraes, CNCFlora (2019) — Chrysophyllum imperiale: ecologia e avaliação EN datada.',
             url='https://proflora.jbrj.gov.br/html/Chrysophyllum%20imperiale_2019.html', retrievedAt='2026-11-11'),
    ],
    curationNotes='Adição solicitada em 11/11/2026. Flora e Funga aceita Martiusella imperialis (FB75839) e trata Chrysophyllum imperiale (FB14458) como sinônimo homotípico; o nome original da observação iNaturalist foi preservado. Nomes e imagem referem-se à mesma espécie, sem criar duas entradas. Forma de vida Árvore adotada conforme Museu Nacional e CNCFlora; o cache atual do serviço Flora informa apenas Arbusto, divergência mantida nesta nota. Foto CC0 de observação em grau de pesquisa de Marliéria/MG; seleção e tags após inspeção visual, em rascunho. Nenhum uso alimentar ou medicinal é recomendado.',
)
catalog['plants'].append(entry)
assert catalog['plants'][:-1] == before['plants'], 'Existing editorial work must remain unchanged.'
destination.write_bytes(payload)
write(evidence_path, evidence)
write(CATALOG, catalog)
write(OUT/'audit.json', dict(
    date='2026-11-11', addedPlantId=entry['id'], acceptedName=entry['scientificName'], synonym='Chrysophyllum imperiale',
    photoId=photo['id'], licenseCode='cc0', visualReview='Direct inspection of the downloaded full photo; AI annotations remain draft.',
    newPhotoBytes=len(payload), previousEntries=len(before['plants']), entries=len(catalog['plants']),
    baselineSha256=hashlib.sha256((OUT/'catalog-before.json').read_bytes()).hexdigest(),
    catalogSha256=hashlib.sha256(CATALOG.read_bytes()).hexdigest(),
))
print(f'Added {entry["scientificName"]}: one CC0 photo, {len(payload):,} bytes; all prior entries unchanged.')
