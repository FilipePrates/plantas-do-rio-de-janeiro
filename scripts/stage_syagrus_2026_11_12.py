"""Apply a bounded, reversible palm draft using the documented editorial text."""
import copy
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'src/data/plants.json'
DOCUMENT = ROOT.parent / 'plantas-rio-content-editor/docs/fichas-em-producao-2026-11-12.md'
AUDIT = ROOT / 'sources/syagrus-2026-11-12/audit.json'

if AUDIT.exists():
    raise SystemExit('Audit already exists; refusing to overwrite existing work.')
catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
document = DOCUMENT.read_text(encoding='utf-8')
sections = re.split(r'^## ', document, flags=re.M)
fields = {'Descrição proposta': 'description', 'Identificação proposta': 'identification', 'Ecologia proposta': 'ecology'}
audit = {'date': '2026-11-12', 'updatedProfiles': []}
source = {'title': 'Noblick (2017). A revision of the genus Syagrus (Arecaceae).',
          'url': 'https://doi.org/10.11646/phytotaxa.294.1.1', 'retrievedAt': '2026-11-12'}
for plant_id, heading in [('syagrus-picrophylla', 'Syagrus picrophylla'), ('syagrus-weddelliana', 'Syagrus weddelliana')]:
    plant = next(p for p in catalog['plants'] if p['id'] == plant_id)
    section = next(s for s in sections if s.startswith(heading))
    previous = copy.deepcopy(plant)
    for label, field in fields.items():
        text = re.search(r'\*\*' + label + r'\.\*\*\s*(.*?)(?=\n\s*\n)', section, re.S)
        assert text, (plant_id, label)
        plant[field] = ' '.join(text.group(1).split())
    plant['reviewStatus'] = 'draft'
    plant['presentation'] = 'profile'
    plant['sources'].append(copy.deepcopy(source))
    if plant_id == 'syagrus-weddelliana':
        plant['sources'].append({'title': 'CNCFlora (2017). Syagrus weddelliana: avaliação e registros.',
                                 'url': 'https://proflora.jbrj.gov.br/html/Syagrus%20weddelliana_2017.html', 'retrievedAt': '2026-11-12'})
    plant['curationNotes'] += ' Texto em rascunho baseado em Noblick (2017), revisao e identificacao das fotos pendentes.'
    changed = [key for key in plant if plant.get(key) != previous.get(key)]
    audit['updatedProfiles'].append({'plantId': plant_id, 'before': {k: previous.get(k) for k in changed},
                                     'after': {k: plant[k] for k in changed}})
AUDIT.parent.mkdir(parents=True, exist_ok=True)
AUDIT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Staged two palm profiles; prior fields preserved in', AUDIT)
