import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const audit = JSON.parse(readFileSync(new URL("../../sources/family-gaps-2026-11-11/audit.json", import.meta.url), "utf8"));
const changes = new Map(audit.updatedProfiles.map(change => [change.plantId, change]));
const palmAudit = JSON.parse(readFileSync(new URL('../../sources/syagrus-2026-11-12/audit.json', import.meta.url), 'utf8'));
const palmChanges = new Map(palmAudit.updatedProfiles.map(change => [change.plantId, change]));
export function beforeFamilyGapReview(plant) {
  const palmChange = palmChanges.get(plant.id);
  if (palmChange) {
    const original = { ...plant };
    for (const [field, value] of Object.entries(palmChange.after)) {
      assert.deepEqual(plant[field], value, `${plant.id}: audited palm ${field}`);
      if (palmChange.before[field] === null) delete original[field];
      else original[field] = palmChange.before[field];
    }
    plant = original;
  }
  const change = changes.get(plant.id);
  if (!change) return plant;
  const original = { ...plant };
  for (const [field, value] of Object.entries(change.after)) {
    const expected = field === "commonName" && value === plant.scientificName ? "" : value;
    assert.deepEqual(plant[field], expected, `${plant.id}: audited family ${field}`);
    if (change.before[field] === null) delete original[field];
    else original[field] = change.before[field];
  }
  return original;
}
