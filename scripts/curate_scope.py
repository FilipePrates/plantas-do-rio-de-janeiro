#!/usr/bin/env python3
"""Produce the scope decisions and draft catalog from the archived baseline.

Default: report only. --apply refuses to overwrite subsequent catalog edits.
--report-current refreshes the audit after photo research without editing plants.
"""
import argparse
import collections
import copy
import csv
import json
from pathlib import Path

from generate_seed import load, eligible, binomial, base

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "sources/scope-2026-10-24"
CATALOG = ROOT / "src/data/plants.json"
DATE = "2026-10-24"
KEEP_EUGENIA = {"Eugenia uniflora", "Eugenia brasiliensis", "Eugenia involucrata", "Eugenia selloi"}
SPLIT = {
    "Anthurium coriaceum": {
        "commonName": "Anthurium coriaceum",
        "description": "Antúrio nativo com folhas inteiras, firmes e alongadas, reunidas sobre um caule curto. Há registro publicado na restinga de Grumari. As fotografias mostram o porte e a inflorescência de exemplares identificados como esta espécie.",
        "identification": "Observe em conjunto as folhas foscas e espessas, a base estreitada da lâmina e a nervura central saliente. Compare também o pecíolo e a inflorescência. A chave regional distingue várias espécies de folhas inteiras; tamanho ou cor isolados não confirmam a identificação.",
    },
    "Anthurium pentaphyllum": {
        "commonName": "Anthurium pentaphyllum",
        "description": "Antúrio nativo com folhas compostas, divididas em folíolos que partem de uma região comum. Uma publicação sobre aráceas das restingas registra a espécie em Copacabana. Esse registro histórico não garante que a população ainda exista no local.",
        "identification": "A folha dividida em folíolos é um ponto de partida útil na chave regional. A foto mostra esse caráter, mas não documenta flores ou frutos. Compare o caule, o pecíolo e a inflorescência com uma chave botânica antes de confirmar exemplares semelhantes; o nome pentaphyllum não deve ser tratado como regra de cinco folíolos.",
    },
}
KEY_SOURCE = {"title": "Dutra Junior, Barros & Coelho (2024). Anthurium da Serra da Tiririca: chave e descrições. Hoehnea 51.",
              "url": "https://www.scielo.br/j/hoehnea/a/8VNp9QTm4nGNQCLV7tTxbXw/?format=html&lang=pt", "retrievedAt": DATE}


def unique_sources(sources):
    return list({s["url"]: s for s in sources}.values())


def verified_profile(name):
    payload, records = load(name)
    record = next((r for r in records if eligible(r) and binomial(r["taxon"]) == name), None)
    return base(name, record, payload) if record else None


def municipal_index(evidence):
    result = collections.defaultdict(list)
    families = {c["species"]: c["family"] for c in evidence["candidates"]}
    for row in evidence["records"]:
        if row["strength"] != "municipal" or row["scientificName"] not in families:
            continue
        if row.get("family") and row["family"] != families[row["scientificName"]]:
            continue
        source = evidence["sources"][row["sourceId"]]
        result[row["scientificName"]].append({
            "scientificName": row["scientificName"], "source": {k: source[k] for k in ["title", "url", "retrievedAt"]},
            "publicationYear": source["publicationYear"], "sourceLocator": row["sourceLocator"], "locality": row["locality"],
        })
    return result


def prepare(baseline, evidence):
    catalog = copy.deepcopy(baseline)
    plants = catalog["plants"]
    local = municipal_index(evidence)
    anthurium = next(p for p in plants if p["id"] == "anthurium-spp")
    for name, text in SPLIT.items():
        plant = verified_profile(name)
        assert plant and local[name]
        plant.update(text)
        plant["photos"] = [ph for ph in anthurium["photos"] if ph["taxonName"] == name]
        plant["regionalEvidence"] = [e for e in anthurium.get("regionalEvidence", []) if e["scientificName"] == name]
        plant["sources"] += [KEY_SOURCE]
        plant["curationNotes"] = "Ficha desmembrada do grupo em 24/10/2026. Fotos e revisão das fotos preservadas; texto e decisão editorial em revisão. Nome científico usado na ausência de nome popular atestado. A chave de Tiririca é usada para morfologia, não como evidência municipal."
        plants.append(plant)
    anthurium["regionalSpecies"] = [s for s in anthurium["regionalSpecies"] if s["scientificName"] not in SPLIT]
    anthurium["photos"] = [ph for ph in anthurium["photos"] if ph["taxonName"] not in SPLIT]
    anthurium["regionalEvidence"] = [e for e in anthurium.get("regionalEvidence", []) if e["scientificName"] not in SPLIT]
    anthurium["commonName"] = "Antúrios — outras espécies"
    n = len(anthurium["regionalSpecies"])
    terrestrial = sum("Terrícola" in s["substrates"] for s in anthurium["regionalSpecies"])
    anthurium["description"] = f"Esta ficha reúne {n} espécies nativas do estado do Rio de Janeiro na Mata Atlântica que não têm ficha individual neste guia; {terrestrial} têm substrato terrícola registrado. Contagens derivadas dos membros e da Flora e Funga do Brasil consultada em 16/10/2026; seleção reorganizada em 24/10/2026. Não são contagens municipais. Anthurium coriaceum e A. pentaphyllum têm fichas próprias."
    anthurium["identification"] = "As fotos desta ficha mostram Anthurium scandens, com seu porte e estruturas reprodutivas; não ilustram as outras espécies enumeradas. Observe a folha inteira, as nervuras e o caule. A separação de muitos antúrios depende também do pecíolo, dos catafilos e da inflorescência, com auxílio de chave botânica e especialista. Uma identificação apenas como Anthurium é adequada quando faltam esses caracteres."
    anthurium["reviewStatus"] = "draft"
    anthurium["sources"] = unique_sources(anthurium["sources"] + [KEY_SOURCE])
    represented = {s["scientificName"] for p in plants for s in (p["regionalSpecies"] if p["rank"] == "genus" else [p])}
    for candidate in evidence["candidates"]:
        name = candidate["species"]
        if name in represented or not local[name]:
            continue
        plant = verified_profile(name)
        if not plant or plant["family"] != candidate["family"]:
            continue
        plant.update(presentation="checklist", description="Espécie nativa com registro municipal publicado nas fontes abaixo. Esta entrada de referência permite consultar o nome e sua documentação; o guia de identificação e as fotografias ainda estão em preparação.",
                     curationNotes="Candidata da planilha, conferida pelo nome exato na fonte municipal e na Flora e Funga do Brasil. Entrada em revisão; registros históricos não comprovam presença atual. Nenhuma categoria de ameaça atual foi inferida.")
        plants.append(plant)
        represented.add(name)
    for genus, common in [("Eugenia", "Eugênias — outras espécies"), ("Myrcia", "Mírcias")]:
        members = [p for p in plants if p["genus"] == genus and p["scientificName"] not in KEEP_EUGENIA]
        assert members and all(p["rank"] == "species" and p["floraId"] for p in members)
        group = copy.deepcopy(members[0])
        group.update(id=genus.lower() + "-spp", scientificName=genus + " spp.", authorship="", commonName=common,
                     rank="genus", floraId=None, geography="rio-state", reviewStatus="draft", presentation="profile",
                     regionalSpecies=[{"scientificName": p["scientificName"], "floraId": p["floraId"], "lifeForms": p["lifeForms"], "substrates": p["substrates"]} for p in members],
                     photos=[ph for p in members for ph in p["photos"]],
                     regionalEvidence=[e for p in members for e in p.get("regionalEvidence", [])],
                     sources=unique_sources([s for p in members for s in p["sources"]]),
                     previousIds=[p["id"] for p in members],
                     alternateNames=sorted({name for p in members for name in [p["commonName"], *p["alternateNames"]] if name != p["scientificName"]}),
                     lifeForms=sorted({v for p in members for v in p["lifeForms"]}),
                     substrates=sorted({v for p in members for v in p["substrates"]}),
                     habitats=sorted({v for p in members for v in p["habitats"]}))
        group["description"] = f"Seleção de {len(members)} espécies nativas de {genus} registradas no estado do Rio de Janeiro e na Mata Atlântica, conforme os membros enumerados e os registros da Flora e Funga do Brasil consultados até 24/10/2026. Esta é a contagem do grupo neste guia, não de todas as espécies do gênero nem uma contagem municipal."
        group["ecology"] = "Ambientes registrados no Brasil para pelo menos um membro desta seleção: " + "; ".join(group["habitats"]) + ". Esses ambientes não se aplicam necessariamente a todos os membros nem comprovam sua ocorrência no município."
        if genus == "Eugenia":
            group["description"] += " Pitanga, grumixama, cereja-do-rio-grande e pitangatuba têm fichas individuais."
        shown = ", ".join(sorted({ph["taxonName"] for ph in group["photos"]}))
        group["identification"] = f"A galeria ilustra somente {shown}. Folhas parecidas não bastam para determinar as demais espécies do grupo. Registre os dois lados da folha, disposição dos ramos, botões, flores e frutos quando disponíveis. A identificação específica precisa de comparação com uma chave de Myrtaceae e, em casos duvidosos, de especialista. Esta ficha ajuda a organizar a comparação; não permite atribuir uma foto a todos os membros nem distinguir todos os gêneros de Myrtaceae apenas pela folha."
        group["curationNotes"] = "Agrupamento editorial em revisão, preparado em 24/10/2026. Nomes, textos e fotos das fichas anteriores preservados no arquivo sources/scope-2026-10-24/catalog-before.json. Membros novos têm evidência municipal e confirmação estadual na Flora e Funga. Os IDs anteriores redirecionam para o grupo."
        plants[:] = [p for p in plants if p not in members] + [group]
    for plant in plants:
        names = [s["scientificName"] for s in plant["regionalSpecies"]] if plant["rank"] == "genus" else [plant["scientificName"]]
        incoming = [e for name in names for e in local[name]]
        if incoming:
            plant["municipalEvidence"] = incoming
            plant["sources"] = unique_sources(plant["sources"] + [e["source"] for e in incoming])
            if plant["rank"] == "species":
                plant["geography"] = "rio-city"
            plant["reviewStatus"] = "draft"
        if plant["rank"] == "species" and not plant["photos"]:
            plant["presentation"] = "checklist"
    philodendron = next(p for p in plants if p["id"] == "philodendron-spp")
    philodendron["identification"] += " A galeria ilustra apenas Philodendron appendiculatum, P. bipennifolium e P. cordatum. A forma da folha pode mudar com o desenvolvimento; a separação das espécies pode exigir inflorescências, detalhes do pecíolo e consulta a especialista."
    philodendron["reviewStatus"] = "draft"
    catalog["updatedAt"] = DATE
    return catalog


def report(catalog, evidence):
    by_name = {s["scientificName"]: p for p in catalog["plants"] for s in (p["regionalSpecies"] if p["rank"] == "genus" else [p])}
    local = municipal_index(evidence)
    photos = {ph["taxonName"] for p in catalog["plants"] for ph in p["photos"] if ph["reviewStatus"] == "reviewed"}
    survey_path = ARCHIVE / "photo-survey.json"
    survey = json.loads(survey_path.read_text()) if survey_path.exists() else {}
    leads = collections.defaultdict(list)
    for e in evidence["records"]:
        if e["strength"] in {"city-unit-lead", "lead"}:
            leads[e["scientificName"]].append(e)
    rows = []
    for c in evidence["candidates"]:
        name = c["species"]; plant = by_name.get(name); verified = verified_profile(name)
        municipal = bool(local[name]) or bool(plant and plant["rank"] == "species" and plant["geography"] == "rio-city")
        decision = "research-backlog"
        reason = "Ainda sem evidência municipal suficiente nas fontes cruzadas; ausência de registro não é ausência da espécie."
        if municipal and verified:
            if plant and plant["rank"] == "genus":
                decision = "genus-group"; reason = "Membro explícito de guia de gênero; identificação específica exige comparação botânica."
            elif plant and plant.get("presentation") != "checklist" and plant["photos"]:
                decision = "individual-page"; reason = "Ficha individual com fotos CC0 já revisadas e registro municipal; conferir suficiência dos caracteres antes de publicar a revisão."
            else:
                decision = "reference-checklist"; reason = "Registro municipal e confirmação na Flora e Funga; ainda sem conjunto revisado de fotos e orientação de identificação para ficha ilustrada."
        elif municipal and not verified:
            reason = "Registro municipal encontrado; confirmar nome aceito, origem nativa, BR-RJ e Mata Atlântica na Flora e Funga antes da inclusão."
        if plant and plant["origin"] != "native":
            decision = "individual-page"; reason = "Exceção editorial já existente: espécie introduzida/invasora para reconhecimento; não pertence à seleção de nativas da planilha."
        if not municipal and leads[name]:
            reason += " Há indicação em UC ou inventário; conferir localidade/voucher antes de promover para municipal."
        if c.get("biome") and "Atlantic_Forest" not in c["biome"].split(";"):
            reason += " A planilha não marca Mata Atlântica; conferir esse atributo."
        supporting = [e for e in evidence["records"] if e["scientificName"] == name]
        links = list(dict.fromkeys(evidence["sources"][e["sourceId"]]["url"] +
                                  ("#page=" + str(e["sourcePage"]) if e.get("sourcePage") else "") for e in supporting))
        if verified:
            links += [s["url"] for s in verified["sources"]]
        if municipal and not local[name] and plant:
            links += [s["url"] for s in plant["sources"]]
        links = list(dict.fromkeys(links))
        priority = "1-municipal" if municipal else "2-locality-lead" if leads[name] else "3-state-only"
        row = {"scientificName": name, "family": c["family"], "genus": c["genus"], "workbookRow": c.get("workbookRow"),
               "decision": decision, "reason": reason, "municipalEvidence": "documented" if municipal else "lead" if leads[name] else "not-found-in-sources",
               "taxonomy": "verified" if verified else "pending", "photoStatus": "reviewed-in-library" if name in photos else survey.get(name, {}).get("status", "not-surveyed"),
               "profileId": plant["id"] if plant else None, "currentRepresentation": "not-in-app" if not plant else "genus-member" if plant["rank"] == "genus" else plant.get("presentation", "profile"),
               "reviewStatus": "draft", "priority": priority, "sources": links,
               "evidenceLocators": " | ".join(e["sourceLocator"] + ": " + e["locality"] for e in supporting),
               "nextAction": "Revisar texto, identificação e adequação das fotos." if decision == "individual-page" else "Revisar membros, limites da identificação e legendas." if decision == "genus-group" else "Buscar/revisar fotos e caracteres diagnósticos." if decision == "reference-checklist" else "Conferir taxonomia e registro municipal com localidade/voucher."}
        rows.append(row)
    summary = {"date": DATE, "spreadsheetCandidates": sum(r["workbookRow"] is not None for r in rows), "totalCandidatesIncludingCatalog": len(rows),
               "spreadsheetDecisions": dict(collections.Counter(r["decision"] for r in rows if r["workbookRow"])),
               "allDecisions": dict(collections.Counter(r["decision"] for r in rows)),
               "municipalCandidates": sum(r["municipalEvidence"] == "documented" for r in rows),
               "photoSurvey": dict(collections.Counter(r["status"] for r in survey.values())),
               "catalogEntries": len(catalog["plants"]), "representedSpecies": len(by_name),
               "profiles": sum(p.get("presentation") != "checklist" for p in catalog["plants"]),
               "checklistOnly": sum(p.get("presentation") == "checklist" for p in catalog["plants"]),
               "groups": {p["genus"]: len(p["regionalSpecies"]) for p in catalog["plants"] if p["rank"] == "genus"}}
    (ROOT / "docs/scope-audit-2026-10-24.json").write_text(json.dumps({"summary": summary, "candidates": rows}, ensure_ascii=False, indent=2) + "\n")
    with (ROOT / "docs/scope-audit-2026-10-24.csv").open("w", encoding="utf-8-sig", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=list(rows[0])); writer.writeheader()
        writer.writerows({**r, "sources": " | ".join(r["sources"])} for r in rows)
    (ROOT / "docs/scope-summary-2026-10-24.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--report-current", action="store_true")
    args = parser.parse_args()
    baseline_path = ARCHIVE / "catalog-before.json"
    baseline = json.loads(baseline_path.read_text())
    evidence = json.loads((ARCHIVE / "evidence.json").read_text())
    catalog = json.loads(CATALOG.read_text()) if args.report_current else prepare(baseline, evidence)
    if args.apply:
        if args.report_current or CATALOG.read_bytes() != baseline_path.read_bytes():
            raise SystemExit("Refusing to overwrite a catalog modified since the archived baseline.")
        CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    report(catalog, evidence)


if __name__ == "__main__":
    main()
