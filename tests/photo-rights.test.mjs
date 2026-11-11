import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("app import rejects a CC BY attribution changed after acquisition", (t) => {
  const catalog = JSON.parse(readFileSync(new URL("../src/data/plants.json", import.meta.url), "utf8"));
  const plant = catalog.plants.find(p => p.photos.some(photo => photo.licenseCode === "cc-by"));
  assert.ok(plant, "CC BY coverage fixture must remain available");
  catalog.plants = [plant];
  const photo = plant.photos.find(photo => photo.licenseCode === "cc-by");
  plant.photos = [photo];
  const directory = mkdtempSync(join(tmpdir(), "plant-photo-rights-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "catalog.json");
  const script = fileURLToPath(new URL("../scripts/catalog.mjs", import.meta.url));
  writeFileSync(path, JSON.stringify(catalog));
  // Preview is read-only and checks both the photo bytes and acquisition evidence.
  execFileSync(process.execPath, [script, "import", path], { stdio: "pipe" });
  photo.attribution = "A different copyright notice";
  writeFileSync(path, JSON.stringify(catalog));
  assert.throws(
    () => execFileSync(process.execPath, [script, "import", path], { stdio: "pipe" }),
    error => /atribuição ou licença divergente/.test(String(error.stderr)),
  );
});
