"""Source-first cactus survey. No canonical catalog or acquisition evidence is edited."""
import json
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from fetch_flora import fetch
from fetch_inat_photos import get

OUT = ROOT/'sources/cactaceae-2026-11-11'
OUT.mkdir(exist_ok=True)
NAMES = ['Brasiliopuntia brasiliensis', 'Cereus hildmannianus', 'Cereus sericifer',
         'Coleocephalocereus fluminensis', 'Opuntia monacantha', 'Pereskia grandifolia',
         'Pereskia aculeata', 'Pilosocereus arrabidae', 'Pilosocereus brasiliensis',
         'Pilosocereus ulei', 'Melocactus violaceus', 'Schlumbergera truncata',
         'Schlumbergera russelliana', 'Rhipsalis paradoxa', 'Rhipsalis pachyptera',
         'Lepismium cruciforme', 'Hatiora salicornioides']

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')

summary = {}
for name in NAMES:
    try:
        records = fetch('taxon/'+name.replace(' ', '_'), name.replace(' ', '_'))
        record = next((r for r in records if r['taxon']['taxonrank']=='ESPECIE' and
                       r['taxon']['genus']+' '+r['taxon']['specificepithet']==name), None)
        if not record:
            print(name, 'no exact Flora record', flush=True)
            continue
        taxon = record['taxon']
        accepted = taxon.get('acceptednameusage')
        summary[name] = dict(status=taxon['taxonomicstatus'], acceptedName=accepted,
                             floraId=taxon['taxonid'], profile=record.get('specie_profile'))
        print('FLORA', name, taxon['taxonomicstatus'], accepted, flush=True)
        if taxon['taxonomicstatus'] != 'NOME_ACEITO':
            continue
        for code in ['cc0', 'cc-by']:
            path = OUT/(name.replace(' ', '_')+'-'+code+'.json')
            if not path.exists():
                params = dict(taxon_name=name,photo_license=code,quality_grade='research',captive='false',
                              per_page=30,order_by='votes',locale='en')
                url='https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode(params)
                data=json.loads(get(url))
                write(path,dict(url=url,data=data))
            data=json.loads(path.read_text(encoding='utf8'))['data']
            summary[name][code]=data.get('total_results',0)
            print('PHOTOS', name, code, data.get('total_results',0), flush=True)
    except Exception as exc:
        summary[name] = dict(error=str(exc))
        print('FAILED', name, str(exc), flush=True)
    write(OUT/'survey.json', summary)
