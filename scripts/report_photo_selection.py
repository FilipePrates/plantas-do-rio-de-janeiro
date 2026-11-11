"""Current coverage of every supplied workbook row, and bounded media audit."""
import csv
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from prepare_scope import read_workbook
from export_scope_xlsx import sheet, NS, REL

catalog = json.loads((ROOT / 'src/data/plants.json').read_text(encoding='utf8'))
audit = json.loads((ROOT / 'sources/photo-selection-2026-11-11/audit.json').read_text(encoding='utf8'))
index = {m['scientificName']: p for p in catalog['plants'] for m in (p['regionalSpecies'] if p['rank'] == 'genus' else [p])}
actions = {a['scientificName']: a for a in audit['actions']}
headers = ['Espécie', 'Família', 'Linha original', 'Situação atual', 'ID', 'Abrangência', 'Fotos na ficha', 'Ação nesta rodada']
rows = []
for row in read_workbook(ROOT / 'docs/Arvores_Arbustos_Nativos_RJ.xlsx'):
    name = row['species']; p = index.get(name)
    status = 'Fora do catálogo' if not p else 'Membro de grupo' if p['rank'] == 'genus' else 'Referência' if p.get('presentation') == 'checklist' else 'Ficha ilustrada'
    rows.append([name, row['family'], row['workbookRow'], status, p['id'] if p else '', p['geography'] if p else '', len(p['photos']) if p else 0, actions.get(name, {}).get('action', '')])
with (ROOT / 'docs/photo-selection-2026-11-11.csv').open('w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f); writer.writerow(headers); writer.writerows(rows)
overview = [['Item', 'Resultado'], ['Data', '11/11/2026'], ['Linhas da planilha original', len(rows)], ['Espécies representadas no catálogo', audit['after']['species']], ['Fichas ilustradas', audit['after']['profiles']], ['Novas fichas ilustradas', len(actions)], ['Novas espécies', len(audit['newSpecies'])], ['Novas fotografias', len(audit['newPhotoIds'])], ['Novos originais (MiB)', round(audit['newMediaBytes']/1048576, 2)], ['Teto de novos originais (MiB)', 10], ['Abrangência', 'Planilha fornecida aceita como autoridade estadual, por orientação do usuário. Sem nova checagem de ocorrência no Rio.'], ['Seleção', 'Qualidade visual antes de quantidade. Fotos anteriores preservadas; 1 ou 2 vistas por nova espécie.'], ['Revisão', 'Textos novos em rascunho. Fotos novas: CC0/CC BY, evidências arquivadas, marcadores unknown e revisão humana pendente.']]
photo_rows = [['Espécie', 'Foto', 'Licença', 'Autor', 'Bytes', 'Link', 'SHA256']]
added = set(audit['newPhotoIds'])
for p in catalog['plants']:
    for ph in p['photos']:
        if ph['photoId'] in added:
            photo_rows.append([p['scientificName'], ph['photoId'], ph['license'], ph['creator'], (ROOT/'assets/plants'/ph['fileName']).stat().st_size, ph.get('photoPageUrl', f"https://www.inaturalist.org/photos/{ph['photoId']}"), ph['sha256']])
changed_rows = [r for r in rows if r[0] in actions]
workbook_names = {r[0] for r in rows}
for name, action in actions.items():
    if name not in workbook_names:
        p = index[name]
        changed_rows.append([name, p['family'], '', 'Ficha ilustrada', p['id'], p['geography'], len(p['photos']), action['action']])
assert len(changed_rows) == len(actions)
sheets = [('Resumo', overview, [40, 120]), ('Cobertura da planilha', [headers]+rows, [35,24,18,24,36,18,18,28]), ('Fichas desta rodada', [headers]+changed_rows, [35,24,18,24,36,18,18,28]), ('Fotos novas', photo_rows, [35,20,18,35,18,60,74])]
with zipfile.ZipFile(ROOT/'docs/decisoes-escopo-2026-10-24.xlsx') as src, zipfile.ZipFile(ROOT/'docs/photo-selection-2026-11-11.xlsx', 'w', zipfile.ZIP_DEFLATED) as target:
    for item in src.namelist():
        if item == 'xl/workbook.xml' or item.startswith('xl/worksheets/sheet'): continue
        target.writestr(item, src.read(item))
    workbook = ET.Element(f'{{{NS}}}workbook'); children = ET.SubElement(workbook, 'sheets')
    for i, (name, content, widths) in enumerate(sheets, 1):
        ET.SubElement(children, 'sheet', {'name':name,'sheetId':str(i),f'{{{REL}}}id':f'rId{i}'})
        target.writestr(f'xl/worksheets/sheet{i}.xml', sheet(content, widths))
    target.writestr('xl/workbook.xml', ET.tostring(workbook, encoding='utf8', xml_declaration=True))
assert hashlib.sha256((ROOT/'docs/Arvores_Arbustos_Nativos_RJ.xlsx').read_bytes()).hexdigest() == audit['workbookSha256']
print(f'Current coverage: {len(rows)} original rows; CSV and XLSX exported.')
