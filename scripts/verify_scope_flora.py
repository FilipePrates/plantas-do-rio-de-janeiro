#!/usr/bin/env python3
"""Cache official Flora e Funga profiles for municipal candidates; no catalog edits."""
import concurrent.futures
import json
from pathlib import Path
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from generate_seed import eligible, binomial

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "sources/scope-2026-10-24"
CACHE = ROOT / "sources/flora"
lock = threading.Lock()
next_start = 0.0


def check(name):
    global next_start
    path = CACHE / (name.replace(" ", "_") + ".json")
    url = "https://servicos.jbrj.gov.br/v2/flora/taxon/" + urllib.parse.quote(name.replace(" ", "_"))
    try:
        if not path.exists():
            with lock:
                time.sleep(max(0, next_start - time.monotonic()))
                next_start = time.monotonic() + 0.6
            request = urllib.request.Request(url, headers={"User-Agent": "PlantasDoRioScope/0.1 (botanical verification)"})
            data = json.load(urllib.request.urlopen(request, timeout=20))
            path.write_text(json.dumps({"url": url, "retrievedAt": datetime.now(timezone.utc).isoformat(), "data": data}, ensure_ascii=False, indent=2) + "\n")
        payload = json.loads(path.read_text())
        records = payload["data"]
        match = next((r for r in records if eligible(r) and binomial(r["taxon"]) == name), None)
        return name, {"status": "verified" if match else "needs-taxonomic-review", "cache": str(path.relative_to(ROOT)), "retrievedAt": payload["retrievedAt"]}
    except Exception as error:
        return name, {"status": "unavailable", "url": url, "error": str(error)}


def main():
    evidence = json.loads((ARCHIVE / "evidence.json").read_text())
    candidates = {r["species"] for r in evidence["candidates"]}
    names = sorted(candidates & {r["scientificName"] for r in evidence["records"] if r["strength"] == "municipal"})
    output = ARCHIVE / "flora-verification.json"
    report = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(check, name) for name in names]
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            name, result = future.result(); report[name] = result
            output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
            if i % 20 == 0: print(f"{i}/{len(names)}: {name}: {result['status']}", flush=True)
    print(f"Completed {len(report)} taxonomic checks.", flush=True)


if __name__ == "__main__":
    main()
