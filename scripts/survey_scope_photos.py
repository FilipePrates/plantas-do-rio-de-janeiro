#!/usr/bin/env python3
"""Survey photo-level CC0 candidates for municipally documented taxa.

Does not download images, mark photographs reviewed, or mutate the catalog.
One request at a time, resumable. A failed/name-mismatched search is unknown.
"""
import hashlib
import json
from pathlib import Path
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "sources/scope-2026-10-24"


def main():
    evidence = json.loads((FOLDER / "evidence.json").read_text())
    candidates = {r["species"] for r in evidence["candidates"]}
    names = sorted(candidates & {r["scientificName"] for r in evidence["records"] if r["strength"] == "municipal"})
    baseline = json.loads((FOLDER / "catalog-before.json").read_text())
    illustrated = {ph["taxonName"] for p in baseline["plants"] for ph in p["photos"]}
    output = FOLDER / "photo-survey.json"
    report = json.loads(output.read_text()) if output.exists() else {}
    for index, name in enumerate(names):
        if name in illustrated or name in report:
            continue
        params = {"taxon_name": name, "photo_license": "cc0", "quality_grade": "research", "captive": "false", "per_page": 3, "order_by": "votes"}
        url = "https://api.inaturalist.org/v1/observations?" + urllib.parse.urlencode(params)
        row = {"url": url, "retrievedAt": datetime.now(timezone.utc).isoformat(), "status": "unknown", "photos": []}
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "PlantasDoRioScope/0.1 (CC0 candidate survey)"})
            payload = urllib.request.urlopen(request, timeout=20).read()
            data = json.loads(payload)
            row.update(responseSha256=hashlib.sha256(payload).hexdigest(), totalObservations=data["total_results"])
            for observation in data["results"]:
                if observation.get("taxon", {}).get("name") != name or observation.get("quality_grade") != "research" or observation.get("captive") or observation.get("flags"):
                    continue
                for photo in observation.get("photos", []):
                    dimensions = photo.get("original_dimensions") or {}
                    if photo.get("license_code") == "cc0" and not photo.get("hidden") and not photo.get("flags") and min(dimensions.get("width", 0), dimensions.get("height", 0)) >= 400:
                        row["photos"].append({"observationId": observation["id"], "taxonName": name, "photo": photo})
            row["status"] = "candidates-found" if row["photos"] else "none-in-search" if data["total_results"] == 0 else "needs-inspection"
        except Exception as error:
            row["error"] = str(error)
        report[name] = row
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        if index % 20 == 0:
            print(f"{index + 1}/{len(names)}: {name}: {row['status']}", flush=True)
        time.sleep(1.1)
    print(f"Completed: {len(report)} searches; {len(illustrated & set(names))} already illustrated.", flush=True)


if __name__ == "__main__":
    main()
