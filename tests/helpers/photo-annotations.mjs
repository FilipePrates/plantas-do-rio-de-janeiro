import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const audit = JSON.parse(readFileSync(new URL(
  "../../sources/photo-annotations-2026-11-11/audit.json", import.meta.url,
), "utf8"));
const changes = new Map(audit.changes.map((change) => [change.photoId, change]));

// Historical migration tests still compare every field, while allowing this
// explicitly audited, user-requested visual annotation pass.
export function beforeVisualAnnotations(photo) {
  const change = changes.get(photo.photoId);
  if (!change) return photo;
  for (const [field, value] of Object.entries(change.after)) {
    assert.deepEqual(photo[field], value, `${photo.photoId}: audited ${field}`);
  }
  return { ...photo, ...change.before };
}
