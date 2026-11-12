"""Add independently sourced Syagrus profiles as drafts, preserving the catalog."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'src/data/plants.json'
catalog = json.loads(path.read_text(encoding='utf-8'))
source = lambda title, url: {'title': title, 'url': url, 'retrievedAt': '2026-11-12'}
noblick = lambda pages: source(f'Noblick (2017). A revision of the genus Syagrus (Arecaceae), pp. {pages}.', 'https://doi.org/10.11646/phytotaxa.294.1.1')
data = [
    ('pseudococos', '(Raddi) Glassman', '178–180',
     'Palmeira de estipe solitário e folhas pinadas. Os folíolos se agrupam em planos diferentes, dando aspecto plumoso à copa. A bráctea lenhosa que envolve a inflorescência apresenta sulcos; os frutos são alongados.',
     'Observe a palmeira inteira, a posição dos folíolos e a bráctea. Na revisão de Noblick, o indumento lanoso na inserção dos folíolos e na face inferior da nervura central ajuda na comparação com espécies próximas. Examine mais de um caráter para confirmar a identificação.',
     'Ocorre na Mata Atlântica, também em áreas rochosas. Henderson registrou a espécie no Parque Natural Municipal da Prainha, no município do Rio de Janeiro.',
     source('Henderson (2009). Palms of southeastern Brazil, pp. 190–191.', 'https://palms.org/wp-content/uploads/2016/05/v53n4p180-191.pdf')),
    ('insignis', '(Devansaye) Becc.', '116–120',
     'Palmeira de estipe solitário e delgado, com folhas pinadas. Os folíolos estreitos dispõem-se regularmente em um plano, verdes na face superior e prateados na inferior.',
     'Registre a planta inteira, as duas faces dos folíolos e a inflorescência. A face inferior prateada também ocorre em Syagrus weddelliana; compare o porte e os demais caracteres da chave antes de identificar a planta.',
     'Palmeira de florestas montanas do Sudeste. Há exemplares documentados em Nova Friburgo e Santa Maria Madalena, no estado do Rio de Janeiro.',
     source('Noblick e Lorenzi (2010). Revisão de Lytocaryum, pp. 8–11.', 'https://palms.org/wp-content/uploads/2016/05/v54n1p5_17.pdf')),
    ('macrocarpa', 'Barb.Rodr.', '139–142',
     'Palmeira de estipe solitário, ereto e liso, com folhas pinadas de aspecto plumoso. Os folíolos se reúnem em grupos e se orientam em planos diferentes. A inflorescência é protegida por uma bráctea lenhosa e sulcada.',
     'Fotografe o estipe, a copa, a inserção dos folíolos e a bráctea. Compare o conjunto de caracteres com a chave de Noblick: a copa plumosa isoladamente não separa esta palmeira de outras Syagrus.',
     'Ocorre no Sudeste do Brasil; Henderson menciona registros raros no oeste do estado do Rio de Janeiro.',
     source('Henderson (2009). Palms of southeastern Brazil, pp. 190–191.', 'https://palms.org/wp-content/uploads/2016/05/v53n4p180-191.pdf')),
]
existing = {p['scientificName'] for p in catalog['plants']}
added = []
for epithet, author, pages, description, identification, ecology, additional in data:
    name = 'Syagrus ' + epithet
    if name in existing or any(name == m['scientificName'] for p in catalog['plants'] for m in p['regionalSpecies']):
        raise SystemExit(f'Already present: {name}')
    plant = dict(id='syagrus-'+epithet, scientificName=name, authorship=author, commonName='', alternateNames=[], family='Arecaceae', genus='Syagrus', rank='species', origin='native', geography='rio-state', reviewStatus='draft', description=description, identification=identification, ecology=ecology, lifeForms=['Palmeira'], substrates=['Terrícola'], habitats=['Floresta Ombrófila (= Floresta Pluvial)'], floraId=None, regionalSpecies=[], photos=[], sources=[noblick(pages), additional], curationNotes='Rascunho baseado em fontes botânicas; revisão humana de texto, ocorrência e eventuais fotos pendente.', presentation='profile')
    catalog['plants'].append(plant)
    added.append(name)
path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Perfis adicionados como rascunho:', ', '.join(added))
