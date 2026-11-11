"""Current coverage and dated research report; original workbook/audits stay untouched."""
import csv
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from prepare_scope import read_workbook
from export_scope_xlsx import sheet, NS, REL


def read(path):
    return json.loads(path.read_text(encoding='utf8'))


def main():
    folder = ROOT / 'sources/expansion-2026-11-11'
    catalog = read(ROOT / 'src/data/plants.json')
    audit = read(folder / 'curation.json')
    research = read(folder / 'research.json')
    old_audit = {r['scientificName']: r for r in read(ROOT / 'docs/scope-audit-2026-10-24.json')['candidates']}
    actions = {r['scientificName']: r for r in audit['staged']}
    candidates = read_workbook(ROOT / 'docs/Arvores_Arbustos_Nativos_RJ.xlsx')
    represented = {m['scientificName']: p for p in catalog['plants'] for m in (p['regionalSpecies'] if p['rank'] == 'genus' else [p])}
    candidate_names = {r['species'] for r in candidates}
    rows = []
    for name in sorted(candidate_names | set(represented)):
        original = next((r for r in candidates if r['species'] == name), None)
        plant = represented.get(name)
        action = actions.get(name)
        survey = research.get(name)
        photos = [ph for ph in plant['photos'] if ph['taxonName'] == name] if plant else []
        municipality = [e for e in plant.get('municipalEvidence', []) if e['scientificName'] == name] if plant else []
        presentation = ('Grupo de gênero' if plant['rank'] == 'genus' else 'Referência' if plant.get('presentation') == 'checklist' else 'Ficha ilustrada') if plant else 'Pesquisa pendente'
        current_research = 'Não pesquisada individualmente nesta rodada'
        if survey:
            current_research = 'Consulta incompleta: ' + survey['error'] if survey.get('error') else 'Confirmação botânica pendente' if not survey.get('eligible') else 'Taxonomia confirmada; fotos candidatas' if survey.get('photos') else 'Taxonomia confirmada; fotos anteriores' if survey.get('existingPhotos') else 'Taxonomia confirmada; sem fotos elegíveis nesta consulta'
        next_action = action.get('referenceReason') if action else None
        next_action = next_action or ('Revisão humana do texto e das fotos; marcar cada foto pelo conteúdo visível.' if action else old_audit.get(name, {}).get('nextAction', 'Conferir fontes botânicas e fotografias antes de ampliar a ficha.'))
        rows.append({
            'scientificName': name, 'family': plant['family'] if plant else original['family'],
            'workbookRow': original['workbookRow'] if original else None,
            'representation': presentation, 'entryId': plant['id'] if plant else '',
            'geography': 'rio-city' if municipality else plant['geography'] if plant and plant['rank'] == 'species' else 'rio-state' if plant else '',
            'action': action['action'] if action else '', 'researchThisPass': current_research,
            'photosCC0': sum(ph['licenseCode'] == 'cc0' for ph in photos),
            'photosCCBY': sum(ph['licenseCode'] == 'cc-by' for ph in photos),
            'reviewStatus': plant['reviewStatus'] if plant else '',
            'municipalSources': ' | '.join(e['source']['url'] for e in municipality),
            'botanicalSources': ' | '.join(s['url'] for s in plant['sources']) if plant else '',
            'nextAction': next_action,
        })
    # A complete coverage index is not an assertion that every row was researched.
    assert sum(r['workbookRow'] is not None for r in rows) == 3114
    summary = {**audit['summary'], 'targetedTaxaResearched': len(research),
               'photoCandidateTaxa': sum(bool(r.get('photos')) for r in research.values()),
               'newIllustratedProfiles': audit['summary']['after']['profiles'] - audit['summary']['before']['profiles'],
               'workbookCoverage': dict(Counter(r['representation'] for r in rows if r['workbookRow'])),
               'scopeNote': '69 consultas individuais direcionadas. As demais linhas indexam a cobertura atual, não representam uma nova pesquisa exaustiva das 3.114 candidatas. Ausência de resultado não significa ausência da espécie ou inexistência de fotografias.'}
    result = {'date': '2026-11-11', 'summary': summary, 'coverage': rows, 'staged': audit['staged'], 'deferred': audit['skipped']}
    (ROOT / 'docs/expansion-2026-11-11.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    with (ROOT / 'docs/expansion-2026-11-11.csv').open('w', newline='', encoding='utf-8-sig') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)
    headers = ['Espécie', 'Família', 'Linha original', 'Apresentação atual', 'ID', 'Abrangência', 'Ação nesta rodada', 'Pesquisa nesta rodada', 'Fotos CC0', 'Fotos CC BY', 'Revisão do texto', 'Fontes municipais', 'Fontes botânicas', 'Próxima ação']
    values = lambda r: list(r.values())
    overview = [['Resumo', 'Valor / orientação'], ['Data', '11/11/2026'],
                ['Espécies representadas', summary['after']['species']], ['Fichas ilustradas', summary['after']['profiles']],
                ['Novas fichas ilustradas', summary['newIllustratedProfiles']], ['Novas espécies', len(summary['newSpecies'])],
                ['Novas fotos incorporadas', len(summary['newPhotoIds'])], ['Candidatas na planilha original', 3114],
                ['Táxons pesquisados nesta rodada', len(research)], ['Limites', summary['scopeNote']],
                ['Revisão', 'Textos e fotografias novos em rascunho. Marcadores de fotos novos não foram inferidos de anotações da observação.'],
                ['Fotos', 'Somente licenças de foto CC0 / CC BY. Créditos, evidências e hashes preservados.'],
                ['Conflito taxonômico', 'A seleção antiga de Philodendron preserva acutatum, curvilobum e imbe, com ressalva explícita sobre a revisão de 2026.'],
                ['Entrada de referência', 'Anthurium comtum continua fora da grade ilustrada por insuficiência do material visual.']]
    widths = [34, 24, 18, 25, 32, 17, 24, 64, 14, 14, 18, 55, 70, 75]
    sheets = [('Resumo', overview, [40, 115]),
              ('Planilha - cobertura atual', [headers] + [values(r) for r in rows if r['workbookRow']], widths),
              ('Fora da planilha', [headers] + [values(r) for r in rows if not r['workbookRow']], widths),
              ('Rodada de novembro', [headers] + [values(r) for r in rows if r['scientificName'] in actions or r['scientificName'] in research], widths)]
    # Reuse only package/style structure of the existing four-sheet stdlib export.
    template = ROOT / 'docs/decisoes-escopo-2026-10-24.xlsx'
    output = ROOT / 'docs/expansion-2026-11-11.xlsx'
    with zipfile.ZipFile(template) as src, zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as target:
        for item in src.namelist():
            if item == 'xl/workbook.xml' or item.startswith('xl/worksheets/sheet'):
                continue
            target.writestr(item, src.read(item))
        workbook = ET.Element(f'{{{NS}}}workbook')
        children = ET.SubElement(workbook, 'sheets')
        for index, (name, content, dimensions) in enumerate(sheets, 1):
            ET.SubElement(children, 'sheet', {'name': name, 'sheetId': str(index), f'{{{REL}}}id': f'rId{index}'})
            target.writestr(f'xl/worksheets/sheet{index}.xml', sheet(content, dimensions))
        target.writestr('xl/workbook.xml', ET.tostring(workbook, encoding='utf8', xml_declaration=True))
    with zipfile.ZipFile(output) as z:
        assert z.testzip() is None
        for filename in z.namelist():
            ET.fromstring(z.read(filename))
        assert len(ET.fromstring(z.read('xl/worksheets/sheet2.xml')).findall(f'{{{NS}}}sheetData/{{{NS}}}row')) == 3115
    assert hashlib.sha256((ROOT / 'docs/Arvores_Arbustos_Nativos_RJ.xlsx').read_bytes()).hexdigest() == summary['sourceWorkbookSha256']
    print(f'Current coverage: {len(rows)} names, including all 3,114 original workbook rows. CSV, JSON and XLSX written.')
    print(json.dumps({k: v for k, v in summary.items() if k in ['before', 'after', 'workbookCoverage', 'newIllustratedProfiles']}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
