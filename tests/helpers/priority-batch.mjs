import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const audit = JSON.parse(readFileSync(new URL("../../sources/begonia-mangrove-2026-11-11/audit.json", import.meta.url), "utf8"));
const changes = new Map(audit.updatedProfiles.map(change => [change.plantId, change]));
const photoChanges = new Map(audit.photoAnnotationCorrections.map(change => [change.photoId, change]));

export function beforePriorityPhotoReview(photo) {
  const change = photoChanges.get(photo.photoId);
  if (!change) return photo;
  for (const [field, value] of Object.entries(change.after)) assert.deepEqual(photo[field], value, `${photo.photoId}: corrected ${field}`);
  return { ...photo, ...change.before };
}

// Restore only enumerated edits so historical preservation checks keep testing
// every other field, photo annotation, license and gallery position exactly.
export function beforePriorityBatchReview(plant) {
  const change = changes.get(plant.id);
  if (!change) return plant;
  const original = { ...plant };
  for (const [field, value] of Object.entries(change.after)) {
    assert.deepEqual(plant[field], value, `${plant.id}: audited priority ${field}`);
    if (change.before[field] === null) delete original[field];
    else original[field] = change.before[field];
  }
  return original;
}
