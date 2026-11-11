"""Cache a photo-backed priority batch; never edits the canonical catalog."""
import json
import sys
import urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from fetch_flora import fetch
from fetch_inat_photos import get
OUT=ROOT/'sources/begonia-mangrove-2026-11-11'
OUT.mkdir(exist_ok=True)
NAMES=['Avicennia germinans','Andira legalis','Cordia superba','Schizolobium parahyba',
       'Hymenaea courbaril','Byrsonima sericea','Ormosia arborea','Bauhinia forficata',
       'Sideroxylon obtusifolium','Begonia acetosa','Begonia arborescens','Begonia convolvulacea',
       'Begonia cucullata','Begonia fischeri','Begonia hirtella','Begonia luxurians','Begonia maculata',
       'Begonia reniformis','Begonia solananthera','Begonia ulmifolia','Begonia angulata',
       'Begonia aconitifolia','Microgramma vacciniifolia','Phlebodium decumanum','Cyperus ligularis',
       'Piper aduncum','Peperomia obtusifolia','Echinodorus grandiflorus']

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
