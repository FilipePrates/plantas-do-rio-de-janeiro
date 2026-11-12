import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const audit = JSON.parse(readFileSync(new URL("../../sources/family-gaps-2026-11-11/audit.json", import.meta.url), "utf8"));
const changes = new Map(audit.updatedProfiles.map(change => [change.plantId, change]));
export function beforeFamilyGapReview(plant) {
  const change = changes.get(plant.id);
  if (!change) return plant;
  const original = { ...plant };
  for (const [field, value] of Object.entries(change.after)) {
    assert.deepEqual(plant[field], value, `${plant.id}: audited family ${field}`);
    if (change.before[field] === null) delete original[field];
    else original[field] = change.before[field];
  }
  return original;
}
