"""Cache a photo-backed priority batch; never edits the canonical catalog."""
import json
import sys
import urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from fetch_flora import fetch
from fetch_inat_photos import get
OUT=ROOT/'sources/family-gaps-2026-11-11'
OUT.mkdir(exist_ok=True)
NAMES=['Guapira opposita', 'Guapira pernambucensis', 'Alchornea triplinervia', 'Alchornea glandulosa', 'Croton floribundus', 'Allophylus edulis', 'Sapindus saponaria', 'Zanthoxylum rhoifolium', 'Cattleya lobata', 'Cattleya forbesii', 'Cattleya warneri', 'Brassavola tuberculata', 'Encyclia patens', 'Miltonia spectabilis', 'Gomesa flexuosa', 'Eulophia alta', 'Sacoila lanceolata', 'Vanilla chamissonis', 'Brasiliorchis picta', 'Cattleya guttata']

NAMES += ['Maxillaria picta']
def write(path,value): path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
summary={}
for name in NAMES:
    try:
        data=fetch('taxon/'+name.replace(' ','_'),name.replace(' ','_'))
        if isinstance(data,dict) and 'data' in data: data=data['data']
        record=next((r for r in data if r['taxon']['taxonrank']=='ESPECIE' and r['taxon']['genus']+' '+r['taxon']['specificepithet']==name),None)
        if not record: print('NO EXACT FLORA',name,flush=True);continue
        summary[name]=dict(status=record['taxon']['taxonomicstatus'],acceptedName=record['taxon'].get('acceptednameusage'),
                           floraId=record['taxon']['taxonid'],family=record['taxon']['family'],
                           nativeRio=any(d.get('locationid')=='BR-RJ' and d.get('establishmentmeans')=='Nativa' for d in record['distribuition']))
        print('FLORA',name,summary[name],flush=True)
        if record['taxon']['taxonomicstatus']!='NOME_ACEITO': continue
        for code in ['cc0','cc-by']:
            path=OUT/(name.replace(' ','_')+'-'+code+'.json')
            if not path.exists():
                params=dict(taxon_name=name,photo_license=code,quality_grade='research',captive='false',per_page=30,order_by='votes',locale='en')
                url='https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode(params)
                write(path,dict(url=url,data=json.loads(get(url))))
            cached=json.loads(path.read_text(encoding='utf8'))['data']
            summary[name][code]=cached.get('total_results',0)
            print('PHOTOS',name,code,summary[name][code],flush=True)
    except Exception as exc:
        summary[name]=dict(error=str(exc));print('FAILED',name,str(exc),flush=True)
    write(OUT/'survey.json',summary)
