"""Survey workbook priorities without modifying catalog; archive public responses."""
import concurrent.futures, json, urllib.parse, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'sources/workbook-batch-2026-11-12'; OUT.mkdir(exist_ok=True)
NAMES=['Esenbeckia leiocarpa','Piper cernuum','Piper amalago','Erythroxylum pulchrum','Ouratea cuspidata','Ouratea multiflora','Coccoloba arborescens','Baccharis dracunculifolia','Vernonanthura polyanthes','Solanum paniculatum','Solanum mauritianum','Pouteria venosa','Trema micranthum']
def task(name):
    result={'name':name}
    for kind,url in [('flora','https://servicos.jbrj.gov.br/v2/flora/taxon/'+name.replace(' ','_')),('photos','https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode(dict(taxon_name=name,photo_license='cc0',quality_grade='research',captive='false',per_page=15,order_by='votes')) )]:
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'PlantasDoRioDraft/0.2 (botanical research)'})
            with urllib.request.urlopen(req,timeout=15) as response: data=json.load(response)
            (OUT/(name.replace(' ','_')+'-'+kind+'.json')).write_text(json.dumps({'url':url,'retrievedAt':'2026-11-12','data':data},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
            result[kind]=len(data) if isinstance(data,list) else data.get('total_results')
        except Exception as e: result[kind+'_error']=str(e)
    return result
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results=list(pool.map(task,NAMES))
(OUT/'survey.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for item in results: print(json.dumps(item,ensure_ascii=False),flush=True)
