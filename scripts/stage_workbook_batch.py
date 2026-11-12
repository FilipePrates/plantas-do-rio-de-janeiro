"""Add sourced workbook profiles as drafts; existing entries are untouched."""
import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/'scripts'))
from generate_seed import eligible, binomial, base
OUT=ROOT/'sources/workbook-batch-2026-11-12'; path=ROOT/'src/data/plants.json'
texts={
'Baccharis dracunculifolia':('Arbusto ramificado com folhas pequenas, estreitas e alternas. As flores ficam reunidas em capítulos pequenos nos ramos.', 'Observe as folhas e os capítulos de perto. A forma e a margem das folhas variam; compare também os caracteres das flores com uma chave de Baccharis.', 'Registrada em formações abertas e florestais, incluindo restinga e áreas alteradas, conforme a Flora e Funga do Brasil.', 'https://www.worldfloraonline.org/taxon/wfo-0000127667'),
'Piper amalago':('Arbusto com folhas simples de nervuras que partem próximas à base e seguem em direção ao ápice. As inflorescências formam espigas alongadas.', 'Registre a folha inteira, sua base e nervuras, além das espigas. Compare esses caracteres com outros Piper: a forma da folha sozinha não confirma a espécie.', 'A Flora e Funga do Brasil registra a espécie como nativa no Rio de Janeiro e em diferentes formações da Mata Atlântica.', 'https://www.scielo.br/j/rod/a/psM63bXrvvJGhckvjKJYBYd/?format=html&lang=pt'),
'Erythroxylum pulchrum':('Arbusto ou árvore com folhas de formato elíptico a oboval. As flores pequenas aparecem junto às folhas.', 'Observe as folhas e fotografe os ramos com flores. A separação de espécies próximas exige exame das estípulas e de detalhes das flores, geralmente com ampliação.', 'Registrada como nativa no Rio de Janeiro; a Flora e Funga do Brasil cita florestas, restinga e vegetação sobre afloramentos entre seus ambientes.', 'https://www.scielo.br/j/rod/a/Pkrc9tGfk7LKdJV8KyZkqns/?lang=pt'),
'Ouratea cuspidata':('Planta lenhosa com folhas simples e alternas, de margens serrilhadas e nervura visível no verso. As flores amarelas se reúnem nas pontas dos ramos.', 'Registre a folha completa e sua margem, além de flores e frutos quando presentes. Compare com outras espécies de Ouratea e use uma chave para confirmar a identificação.', 'Espécie nativa registrada no Rio de Janeiro; ocorre em restinga e floresta ombrófila segundo a Flora e Funga do Brasil.', 'https://www.museunacional.ufrj.br/hortobotanico/restinga/Ourateacuspidata.html'),
'Solanum paniculatum':('Arbusto de folhas variáveis, por vezes lobadas, com a face inferior esbranquiçada pela pilosidade. As flores podem ser lilases ou claras, com anteras amarelas.', 'Observe as duas faces da folha, eventuais acúleos e as flores. Há várias jurubebas semelhantes: o nome popular e uma única folha não bastam para confirmar a espécie.', 'Registrada como nativa no estado, em floresta ombrófila e áreas alteradas na Flora e Funga do Brasil.', 'https://new.scielo.br/j/rod/a/YZRtyFnrjzxdDqnbtjMhL8w/?ilang=pt_BR&lang=pt'),
'Solanum mauritianum':('Arbusto ou árvore com folhas simples, alternas e pilosas, de faces com aparência diferente. Suas flores têm formato estrelado.', 'Fotografe o conjunto da planta, as duas faces das folhas e flores ou frutos. Compare o indumento e a forma das folhas com outras espécies de Solanum.', 'A Flora e Funga do Brasil registra a espécie como nativa no Rio de Janeiro e em ambientes florestais e alterados.', 'https://fitoterapiabrasil.com.br/sites/default/files/documentos-oficiais/especies-arboreas-brasileiras-vol-5red.pdf'),
}
catalog=json.loads(path.read_text(encoding='utf8')); existing={p['scientificName'] for p in catalog['plants']}|{m['scientificName'] for p in catalog['plants'] for m in p['regionalSpecies']}
added=[]
for name,(description,identification,ecology,url) in texts.items():
    if name in existing: print('SKIP existing',name); continue
    payload=json.loads((OUT/(name.replace(' ','_')+'-flora.json')).read_text(encoding='utf8'))
    rows=[r for r in payload['data'] if eligible(r) and binomial(r['taxon'])==name]
    if len(rows)!=1: print('SKIP ambiguous',name); continue
    p=base(name,rows[0],payload)
    if p['commonName']==name:p['commonName']=''
    p.update(presentation='profile',description=description,identification=identification,ecology=ecology)
    p['sources'].append({'title':'Tratamento botânico específico · '+name,'url':url,'retrievedAt':'2026-11-12'})
    p['curationNotes']+=' Texto e fotografias em rascunho, pendentes de revisão humana; ambientes informados têm abrangência brasileira.'
    catalog['plants'].append(p); added.append(p['id'])
path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'added.json').write_text(json.dumps({'addedPlantIds':added},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('ADDED',*added)
