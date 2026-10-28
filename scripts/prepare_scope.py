#!/usr/bin/env python3
"""Reproduce the dated scope audit from archived public sources, without network access.

Writes research outputs only. Catalog changes are prepared separately so rerunning
the audit cannot overwrite editor work. Requires Poppler's pdftotext.
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET
import zipfile
from html.parser import HTMLParser

from import_rio_uc import extract, CITY_UNITS

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "sources/scope-2026-10-24"
DATE = "2026-10-24"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SOURCES = {
    "smac-city-2022": {
        "title": "SMAC (2022). Lista de espécies da flora nativa com ocorrência no município. Anexo I, Resolução 074 de 19/08/2022.",
        "url": "https://doweb.rio.rj.gov.br/portal/edicoes/download/5436",
        "retrievedAt": DATE, "publicationYear": 2022,
    },
    "myrtaceae-city-2017": {
        "title": "Coelho, R. A. (2017). Myrtaceae no município do Rio de Janeiro. UFRRJ. Apêndice 1.",
        "url": "https://rima.ufrrj.br/jspui/bitstream/20.500.14407/5282/1/MONOGRAFIA%20-%20Rodolpho%20Afonso%20Coelho%282017-II%29.pdf",
        "retrievedAt": DATE, "publicationYear": 2017,
    },
    "uc-2018": {
        "title": "Maurenza et al. (2018). Lista da Flora das Unidades de Conservação Estaduais do Rio de Janeiro.",
        "url": "https://www.inea.rj.gov.br/wp-content/uploads/2019/09/Listas-das-UCs.pdf",
        "retrievedAt": DATE, "publicationYear": 2018,
    },
    "araceae-grumari-2018": {
        "title": "Calazans et al. (2018). Araceae of Grumari restinga. Acta Botanica Brasilica 32:55–62. Table 1.",
        "url": "https://www.scielo.br/j/abb/a/GGybdkpkbCQW4rcycX8sNXq/?format=html&lang=en",
        "retrievedAt": DATE, "publicationYear": 2018,
    },
}


def read_workbook(path):
    with zipfile.ZipFile(path) as z:
        strings = ["".join(t.itertext()) for t in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
        rows = ET.fromstring(z.read("xl/worksheets/sheet1.xml")).findall(".//m:sheetData/m:row", NS)
        result = []
        headers = None
        for row in rows:
            values = {}
            for cell in row.findall("m:c", NS):
                column = re.sub(r"\d", "", cell.get("r"))
                value = cell.find("m:v", NS)
                value = value.text if value is not None else ""
                if cell.get("t") == "s":
                    value = strings[int(value)]
                values[column] = value
            if headers is None:
                headers = values
            else:
                result.append({**{headers[k]: v for k, v in values.items()}, "workbookRow": int(row.get("r"))})
    assert len(result) == 3114 and len({r["species"] for r in result}) == 3114
    return result


def pdf_pages(name, raw=False):
    return subprocess.check_output(["pdftotext", "-raw" if raw else "-layout", str(ARCHIVE / (name + ".pdf")), "-"], text=True).split("\f")


def smac_records():
    pages = pdf_pages("smac-city-2022", True)
    records = []
    for page in [18, 19, 20]:
        content = pages[page - 1]
        if page == 18:
            content = content[content.index("ANEXO I"):]
        if page == 20:
            content = content[:content.index("TOTAL")]
        for match in re.finditer(r"(?m)^\s*(\d{1,3})\s+([A-Z][a-z]+ [a-z-]+)(.*?)(?=^\s*\d{1,3}\s+[A-Z][a-z]+ |\Z)", content, re.S):
            number = int(match[1])
            if 1 <= number <= 348:
                records.append({"scientificName": match[2], "sourceId": "smac-city-2022", "sourcePage": page,
                                "sourceLocator": f"Anexo I, item {number}; página {page} do PDF", "item": number,
                                "locality": "Município do Rio de Janeiro", "strength": "municipal", "rawRow": match[0].strip()})
    assert sorted(r["item"] for r in records) == list(range(1, 349)), "Municipal table layout changed"
    return records


def myrtaceae_records():
    pages = pdf_pages("myrtaceae-city-2017")
    bbox = ET.fromstring(subprocess.check_output(["pdftotext", "-bbox", str(ARCHIVE / "myrtaceae-city-2017.pdf"), "-"]))
    box_pages = bbox.findall(".//{http://www.w3.org/1999/xhtml}page")
    records = []
    for page in range(60, 70):
        lines = pages[page - 1].splitlines()
        words = box_pages[page - 1].findall("{http://www.w3.org/1999/xhtml}word")
        columns = {w.text: (float(w.get("xMin")) + float(w.get("xMax"))) / 2 for w in words if w.text in {"BJ", "GRU", "MAR", "PB", "TIJ", "GM"}}
        assert len(columns) == 6
        for line_number, line in enumerate(lines):
            match = re.match(r"^([A-Z][a-z]+ [a-z-]+)\s", line)
            if not match or re.search(r"\b(?:var\.|subsp\.|f\.)\s", line):
                continue
            continuation = []
            if not re.search(r"\s{2,}([A-Z]+(?:\s*\d+)?)\s*$", line):
                continuation = [lines[line_number + 1]]
                assert not re.match(r"^[A-Z][a-z]+ [a-z-]+\s", continuation[0]), line
            genus, epithet = match[1].split()
            positions = [float(w.get("yMin")) for i, w in enumerate(words[:-1]) if w.text == genus and words[i + 1].text == epithet]
            assert positions, match[1]
            y = min(positions)  # species row precedes any infraspecific row
            locations = []
            for word in words:
                if word.text == "X" and abs(float(word.get("yMin")) - y) < (10 if continuation else 3):
                    x = (float(word.get("xMin")) + float(word.get("xMax"))) / 2
                    nearest = min(columns, key=lambda c: abs(columns[c] - x))
                    assert abs(columns[nearest] - x) < 7, (match[1], x, columns)
                    locations.append(nearest)
            line = "\n".join([line] + continuation)
            # MAR and GM extend beyond the municipality. Do not infer a city
            # locality from those columns alone, nor from an unlocalized voucher.
            local = sorted(set(locations) & {"BJ", "GRU", "PB", "TIJ"})
            voucher = re.search(r"\s{2,}([A-Z]+(?:\s*\d+)?)\s*$", line)
            assert voucher, line
            records.append({"scientificName": match[1], "family": "Myrtaceae", "sourceId": "myrtaceae-city-2017",
                            "sourcePage": page, "sourceLocator": f"Apêndice 1, página {page} do PDF; voucher {voucher[1]}",
                            "locality": "; ".join({"BJ": "Baixada de Jacarepaguá", "GRU": "Grumari", "PB": "Maciço da Pedra Branca", "TIJ": "Maciço da Tijuca"}[v] for v in local) or "Localidade municipal a conferir",
                            "strength": "municipal" if local else "lead", "voucher": voucher[1], "areaCodes": locations, "rawRow": line.strip()})
    assert len(records) > 190
    return records


class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_data(self, data):
        self.parts.append(data)


def plain(html):
    parser = Text(); parser.feed(html)
    return " ".join(" ".join(parser.parts).split())


def araceae_records():
    html = (ARCHIVE / "araceae-grumari-2018.html").read_text()
    table = re.findall(r"<table.*?</table>", html, re.S)[0]
    rows = re.findall(r"<tr.*?</tr>", table, re.S)
    records = []
    for row in rows:
        cells = [plain(c) for c in re.findall(r"<t[dh]\b[^>]*>(.*?)</t[dh]>", row, re.S)]
        if len(cells) != 14 or cells[0] == "Species":
            continue
        name = re.match(r"[A-Z][a-z]+ [a-z-]+", cells[0])[0]
        # Table columns: Búzios, Copacabana, Grumari, Grussaí, Jacarepaguá, ...
        local = [label for i, label in [(2, "Copacabana"), (3, "Grumari"), (5, "Jacarepaguá")] if cells[i] == "1"]
        if local:
            records.append({"scientificName": name, "family": "Araceae", "sourceId": "araceae-grumari-2018",
                            "sourceLocator": "Tabela 1, colunas Copacabana / Grumari / Jacarepaguá",
                            "locality": "; ".join(local), "strength": "municipal", "rawRow": cells})
    assert any(r["scientificName"] == "Anthurium coriaceum" for r in records)
    assert any(r["scientificName"] == "Anthurium pentaphyllum" for r in records)
    assert not any(r["scientificName"] == "Anthurium scandens" for r in records)
    return records


def main():
    workbook = read_workbook(ARCHIVE / "Arvores_Arbustos_Nativos_RJ.xlsx")
    baseline = json.loads((ARCHIVE / "catalog-before.json").read_text())
    candidates = {row["species"]: row for row in workbook}
    for p in baseline["plants"]:
        for name in ([s["scientificName"] for s in p["regionalSpecies"]] if p["rank"] == "genus" else [p["scientificName"]]):
            candidates.setdefault(name, {"species": name, "family": p["family"], "genus": p["genus"], "origin": p["origin"], "fromCatalog": True})
    names = {name: row["family"] for name, row in candidates.items()}
    rows, sections = extract(pdf_pages("uc-2018"), names)
    assert len(sections) == 31
    records = smac_records() + myrtaceae_records() + araceae_records()
    for row in rows:
        records.append({"scientificName": row["scientificName"], "family": names[row["scientificName"]], "sourceId": "uc-2018",
                        "sourcePage": row["sourcePage"], "sourceLocator": f"Página {row['sourcePage']} do PDF; {row['voucher']}",
                        "locality": row["unit"], "strength": "city-unit-lead" if row["unit"] in CITY_UNITS else "state",
                        "voucher": row["voucher"], "rawRow": row["rawRow"]})
    # Only exact binomials enter this pass. Potential synonyms remain visible in
    # the audit rather than being guessed from similar spellings.
    evidence = {"date": DATE, "sources": SOURCES, "records": records, "candidates": list(candidates.values())}
    evidence["files"] = {p.name: {"sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "bytes": p.stat().st_size}
                         for p in ARCHIVE.iterdir() if p.suffix in {".xlsx", ".pdf", ".html"}}
    (ARCHIVE / "evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(workbook)} spreadsheet candidates; {len(candidates)} including existing catalog; {len(records)} evidence records")
    print(f"{len({r['scientificName'] for r in records if r['strength']=='municipal'} & set(candidates))} exact candidates with municipal evidence")


if __name__ == "__main__":
    main()
