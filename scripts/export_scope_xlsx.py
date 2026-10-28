#!/usr/bin/env python3
"""Export the dated scope decisions as a filterable workbook using stdlib only."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
ET.register_namespace("", NS)
DECISIONS = {"individual-page": "Ficha individual", "genus-group": "Grupo de gênero",
             "reference-checklist": "Lista de referência", "research-backlog": "Pesquisa pendente"}
PHOTOS = {"reviewed-in-library": "Fotos revisadas no acervo", "candidates-found": "Candidatas CC0 encontradas; revisão pendente",
          "none-in-search": "Sem resultado na consulta datada", "needs-inspection": "Resultado precisa de inspeção",
          "not-surveyed": "Ainda não consultada", "unknown": "Consulta indisponível"}


def column(index):
    result = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def sheet(rows, widths):
    root = ET.Element(f"{{{NS}}}worksheet")
    views = ET.SubElement(root, "sheetViews")
    view = ET.SubElement(views, "sheetView", workbookViewId="0")
    ET.SubElement(view, "pane", ySplit="1", topLeftCell="A2", activePane="bottomLeft", state="frozen")
    cols = ET.SubElement(root, "cols")
    for i, width in enumerate(widths, 1):
        ET.SubElement(cols, "col", min=str(i), max=str(i), width=str(width), customWidth="1")
    data = ET.SubElement(root, "sheetData")
    for number, values in enumerate(rows, 1):
        row = ET.SubElement(data, "row", r=str(number), ht="30" if number == 1 else "45", customHeight="1")
        for i, value in enumerate(values, 1):
            cell = ET.SubElement(row, "c", r=f"{column(i)}{number}", t="inlineStr", s="1" if number == 1 else "0")
            text = ET.SubElement(ET.SubElement(cell, "is"), "t")
            text.text = str(value if value is not None else "")
    ET.SubElement(root, "autoFilter", ref=f"A1:{column(len(rows[0]))}{len(rows)}")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def main():
    report = json.loads((ROOT / "docs/scope-audit-2026-10-24.json").read_text())
    summary = report["summary"]
    headers = ["Espécie", "Família", "Decisão (rascunho)", "Motivo", "Evidência municipal", "Taxonomia",
               "Fotografias", "Prioridade", "Representação no aplicativo", "Fontes", "Localizadores / vouchers", "Próxima ação", "Linha da planilha original"]
    def values(row):
        return [row["scientificName"], row["family"], DECISIONS[row["decision"]], row["reason"],
                {"documented": "Documentada", "lead": "Indicação a conferir", "not-found-in-sources": "Não encontrada nas fontes consultadas"}[row["municipalEvidence"]],
                "Confirmada na Flora e Funga" if row["taxonomy"] == "verified" else "Pendente",
                PHOTOS[row["photoStatus"]], row["priority"], row["currentRepresentation"], " | ".join(row["sources"]),
                row["evidenceLocators"], row["nextAction"], row["workbookRow"]]
    widths = [34, 22, 24, 65, 30, 28, 42, 23, 26, 55, 65, 55, 22]
    rows = report["candidates"]
    overview = [["Resumo", "Valor / orientação"], ["Data das fontes e decisões", "24/10/2026; relatório concluído em 27/10/2026"],
                ["Candidatas da planilha", summary["spreadsheetCandidates"]],
                *[[DECISIONS[k], v] for k, v in summary["spreadsheetDecisions"].items()],
                ["Espécies representadas no aplicativo", summary["representedSpecies"]],
                ["Fichas ilustradas (incluindo grupos)", summary["profiles"]],
                ["Entradas de referência", summary["checklistOnly"]],
                ["Como interpretar", "As decisões são rascunhos. Pesquisa pendente não significa ausência no município. As fichas estaduais já existentes foram preservadas."],
                ["Fotografias", "As consultas CC0 não substituem revisão visual. Ausência de resultado em uma consulta não prova inexistência de fotos. Nenhuma nova foto foi incorporada."],
                ["Grupos", "Membros são enumerados e não duplicam fichas individuais. As fotos mostram somente as espécies legendadas."],
                ["Evidência", "Correspondências exatas, fontes datadas e registros municipais. Sem inferência automática a partir de UCs que cruzam municípios ou de nomes semelhantes."]]
    sheets = [("Resumo", overview, [42, 110]),
              ("Candidatas da planilha", [headers] + [values(r) for r in rows if r["workbookRow"]], widths),
              ("Outras do catálogo", [headers] + [values(r) for r in rows if not r["workbookRow"]], widths),
              ("Fotos para revisar", [headers] + [values(r) for r in rows if r["photoStatus"] in {"candidates-found", "needs-inspection"}], widths)]
    path = ROOT / "docs/decisoes-escopo-2026-10-24.xlsx"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        types = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        types += "".join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1, len(sheets) + 1)) + '</Types>'
        z.writestr("[Content_Types].xml", types)
        z.writestr("_rels/.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+REL+'/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        workbook = ET.Element(f"{{{NS}}}workbook")
        items = ET.SubElement(workbook, "sheets")
        for i, (name, content, dimensions) in enumerate(sheets, 1):
            ET.SubElement(items, "sheet", {"name": name, "sheetId": str(i), f"{{{REL}}}id": f"rId{i}"})
            z.writestr(f"xl/worksheets/sheet{i}.xml", sheet(content, dimensions))
        z.writestr("xl/workbook.xml", ET.tostring(workbook, encoding="utf-8", xml_declaration=True))
        relationships = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        relationships += "".join(f'<Relationship Id="rId{i}" Type="{REL}/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1, len(sheets) + 1))
        relationships += f'<Relationship Id="rId{len(sheets)+1}" Type="{REL}/styles" Target="styles.xml"/></Relationships>'
        z.writestr("xl/_rels/workbook.xml.rels", relationships)
        z.writestr("xl/styles.xml", f'''<styleSheet xmlns="{NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF70815F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>''')
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        for name in z.namelist():
            ET.fromstring(z.read(name))
        imported = ET.fromstring(z.read("xl/worksheets/sheet2.xml"))
        assert len(imported.findall(f"{{{NS}}}sheetData/{{{NS}}}row")) == 3115
    print(f"Wrote {path.relative_to(ROOT)} with 3,114 spreadsheet decisions and {len(rows)-3114} existing catalog taxa.")


if __name__ == "__main__":
    main()
