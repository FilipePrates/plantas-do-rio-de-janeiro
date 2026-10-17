#!/usr/bin/env python3
"""Import exact species matches from the 2018 JBRJ/CNCFlora/INEA UC list.

Usage: python3 scripts/import_rio_uc.py /path/Listas-das-UCs.pdf [--apply]
Requires Poppler's pdftotext. No network calls. Preview is the default.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.inea.rj.gov.br/wp-content/uploads/2019/09/Listas-das-UCs.pdf"
TITLE = "Maurenza et al. (2018). Lista da Flora das Unidades de Conservação Estaduais do Rio de Janeiro. JBRJ/CNCFlora/INEA."
# One-based PDF pages of the UC introductions, which explicitly locate them
# entirely in Rio city. A multi-municipality UC never supplies a city label.
CITY_UNITS = {
    "Parque Estadual da Chacrinha": 44,
    "Parque Estadual da Pedra Branca": 92,
    "Parque Estadual do Grajaú": 170,
    "Reserva Biológica Estadual de Guaratiba": 223,
}


def unit_title(heading):
    words = re.sub(r"^\d+\.\s*", "", heading).title().split()
    return " ".join(word.lower() if word in {"Da", "Das", "De", "Do", "Dos"} else word for word in words)


def parse_row(line, names):
    match = re.match(r"^\s*(\w+aceae)\s+([A-Z][a-z]+ [a-z-]+)(?:\s|$)", line)
    if not match or match[2] not in names:
        return None
    fields = re.split(r"\s{2,}", line.strip())
    # Never transfer a variety/subspecies assessment or endemicity to its parent.
    if re.search(r"\b(?:var\.|subsp\.|f\.)\s", fields[1]):
        return None
    if len(fields) not in (3, 4) or (len(fields) == 4 and fields[-1] not in {"CR", "EN", "VU"}):
        return None
    if match[1] != names[match[2]]:
        return None
    return {
        "scientificName": match[2], "sourceName": fields[1],
        "voucher": fields[2],
        "category": fields[3] if len(fields) == 4 else None,
        "endemicToRioState": "*" in fields[1],
    }


def extract(pages, names):
    unit = None
    records = []
    sections = []
    for page, content in enumerate(pages, 1):
        if page < 24:
            continue
        lines = content.strip().splitlines()
        if not lines:
            continue
        if re.match(r"^\d+\. (?:ESTAÇÃO|PARQUE|RESERVA|ÁREA|FLORESTA) ", lines[0]):
            heading = lines[0]
            if heading.endswith("SUSTENTÁVEL DO"):
                heading += " " + lines[1]
            unit = unit_title(heading)
            sections.append({"name": unit, "sourcePage": page})
        # Rows occur only in tables whose category column identifies the list.
        if not unit or "MMA 443/2014" not in content:
            continue
        for line in content.splitlines():
            row = parse_row(line, names)
            if row:
                records.append({**row, "unit": unit, "sourcePage": page, "rawRow": line.strip()})
    return records, sections


def apply_records(catalog, rows, source):
    by_name = {}
    for row in rows:
        name = row["scientificName"]
        evidence = by_name.setdefault(name, {
            "scientificName": name, "publicationYear": 2018, "source": source,
            "conservationUnits": [], "conservationAssessments": [],
        })
        unit = {"name": row["unit"], "voucher": row["voucher"], "sourcePage": row["sourcePage"]}
        if unit["name"] in CITY_UNITS:
            unit.update(municipality="Rio de Janeiro", municipalitySourcePage=CITY_UNITS[unit["name"]])
        if not any(u["name"] == unit["name"] for u in evidence["conservationUnits"]):
            evidence["conservationUnits"].append(unit)
        if row["category"]:
            assessment = {
                "category": row["category"], "scope": "brazil", "referenceYear": 2014,
                "referenceTitle": "Portaria MMA 443/2014, citada na publicação de 2018",
                "sourcePage": row["sourcePage"],
            }
            if evidence["conservationAssessments"] and evidence["conservationAssessments"][0]["category"] != row["category"]:
                raise ValueError(f"Conflicting historical categories: {name}")
            if not evidence["conservationAssessments"]:
                evidence["conservationAssessments"].append(assessment)
        if row["endemicToRioState"]:
            evidence["endemicToRioState"] = True
    matched_entries = 0
    for plant in catalog["plants"]:
        names = [s["scientificName"] for s in plant["regionalSpecies"]] if plant["rank"] == "genus" else [plant["scientificName"]]
        incoming = [by_name[name] for name in names if name in by_name]
        # Replace only this importer’s dated source; keep all other/editor evidence.
        old = [e for e in plant.get("regionalEvidence", []) if e["source"]["url"] != URL]
        if incoming:
            matched_entries += 1
        if incoming or plant.get("regionalEvidence"):
            plant["regionalEvidence"] = old + incoming
        # UC membership alone never changes the catalog's municipal scope.
    return by_name, matched_entries


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    raw = args.pdf.read_bytes()
    pages = subprocess.check_output(["pdftotext", "-layout", str(args.pdf), "-"], text=True).split("\f")
    # Refuse a different publication/layout instead of silently assigning wrong UCs.
    if len(pages) != 423 or "MMA 443/2014" not in pages[24]:
        raise ValueError("Expected the 422-page 2018 UC list; inspect this document before importing.")
    catalog_path = ROOT / "src/data/plants.json"
    catalog = json.loads(catalog_path.read_text())
    names = {name: p["family"] for p in catalog["plants"] for name in
             ([s["scientificName"] for s in p["regionalSpecies"]] if p["rank"] == "genus" else [p["scientificName"]])}
    rows, sections = extract(pages, names)
    if len(sections) != 31:
        raise ValueError("Expected 31 published UC chapters; check section boundaries.")
    retrieved = datetime.now(timezone.utc).isoformat()
    source = {"title": TITLE, "url": URL, "retrievedAt": retrieved}
    matched, entries = apply_records(catalog, rows, source)
    summary = {
        "matchedEntries": entries, "matchedSpecies": len(matched),
        "unitRecords": sum(len(e["conservationUnits"]) for e in matched.values()),
        "speciesWithHistoricalCategory": sum(bool(e["conservationAssessments"]) for e in matched.values()),
        "speciesInCityUnits": sum(any(u.get("municipality") for u in e["conservationUnits"]) for e in matched.values()),
        "unmatchedSpecies": sorted(set(names) - set(matched)),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if not args.apply:
        print("Preview only. Add --apply to write catalog and source evidence.")
        return
    evidence = {
        "source": source, "publicationYear": 2018,
        "datasetUrl": "https://ckan.jbrj.gov.br/dataset/ucsestaduaisrj",
        "datasetLicense": "Creative Commons Attribution (as declared by JBRJ CKAN)",
        "documentSha256": hashlib.sha256(raw).hexdigest(), "pdfPages": 422,
        "method": "Exact binomial and family; infraspecific taxa and ambiguous rows excluded. No synonym expansion. Empty category is unknown. No geographic promotion. PDF pages are one-based.",
        "summary": summary, "sections": sections, "rows": rows,
    }
    folder = ROOT / "sources/rio-conservation"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "uc-flora-2018.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n")
    catalog["updatedAt"] = retrieved
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
