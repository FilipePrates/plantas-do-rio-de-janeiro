import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { withoutRepeatedCommonNames } from "./helpers/common-names.mjs";
import { beforeVisualAnnotations } from "./helpers/photo-annotations.mjs";
import { beforeCactusProfileReview } from "./helpers/cactaceae.mjs";
import { beforePriorityBatchReview, beforePriorityPhotoReview } from "./helpers/priority-batch.mjs";
import { beforeFamilyGapReview } from "./helpers/family-gaps.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const before = read("../sources/photo-annotations-2026-11-11/catalog-before.json");
const catalog = read("../src/data/plants.json");
const annotations = read("../sources/photo-annotations-2026-11-11/annotations.json");
const audit = read("../sources/photo-annotations-2026-11-11/audit.json");
const photos = (value) => value.plants.flatMap((plant) => plant.photos);

test("visual annotation pass preserves complete plant records, photo order, rights and evidence", () => {
  // Later additions are allowed; every record covered by this historical pass
  // still retains its exact fields and gallery order.
  const previousIds = new Set(before.plants.map((plant) => plant.id));
  const restored = { ...structuredClone(catalog), plants: structuredClone(catalog.plants.filter((plant) => previousIds.has(plant.id)).map(beforeFamilyGapReview).map(beforePriorityBatchReview).map(beforeCactusProfileReview)) };
  for (const plant of restored.plants) plant.photos = plant.photos.map(beforeVisualAnnotations);
  assert.deepEqual(withoutRepeatedCommonNames(restored), withoutRepeatedCommonNames(before));
  const changedIds = new Set(audit.changes.map((change) => change.photoId));
  assert.equal(changedIds.size, audit.changedPhotos);
  for (const change of audit.changes) {
    assert.deepEqual(Object.keys(change.after).sort(), ["caption", "markers", "reviewStatus"]);
    assert.equal(change.after.reviewStatus, "draft");
  }
});

test("every photo was individually viewed and now has a caption; existing descriptions and cautions survive", () => {
  const current = new Map(photos(catalog).map(beforePriorityPhotoReview).map((photo) => [String(photo.photoId), photo]));
  const reviewedIds = photos(before).map((photo) => String(photo.photoId));
  assert.equal(audit.viewedPhotos, reviewedIds.length);
  assert.deepEqual(Object.keys(annotations).sort(), reviewedIds.sort());
  for (const photo of current.values()) assert.ok(photo.caption.trim(), String(photo.photoId));
  for (const old of photos(before)) {
    const photo = current.get(String(old.photoId));
    const annotation = annotations[String(old.photoId)];
    assert.equal(annotation.viewed, true);
    assert.ok(photo.caption.trim(), String(old.photoId));
    if (old.caption.trim()) {
      if (/^(Identificação a conferir:|Conferir identificação)/u.test(old.caption.trim())) {
        assert.ok(photo.caption.endsWith(old.caption), String(old.photoId));
      } else assert.equal(photo.caption, old.caption, String(old.photoId));
    }
    assert.ok(photo.markers.length);
    assert.equal(new Set(photo.markers).size, photo.markers.length);
    if (photo.markers.includes("unknown")) assert.deepEqual(photo.markers, ["unknown"]);
    if (photo.caption !== old.caption || JSON.stringify(photo.markers) !== JSON.stringify(old.markers)) {
      assert.equal(photo.reviewStatus, "draft", String(old.photoId));
    }
  }
});

test("visual corrections distinguish reproductive stages, exposed seeds, aerial roots and uncertain galls", () => {
  const markers = new Map(photos(catalog).map((photo) => [photo.photoId, photo.markers]));
  const index = read("../sources/photo-annotations-2026-11-11/index.json");
  const row = (number) => index.find((item) => item.number === number);
  for (const number of [273, 386, 428, 474]) assert.ok(markers.get(row(number).photoId).includes("fruit"));
  for (const number of [284, 327, 367, 399, 462]) assert.ok(markers.get(row(number).photoId).includes("seed"));
  for (const number of [456, 457]) assert.deepEqual(markers.get(row(number).photoId), ["root"]);
  assert.deepEqual(markers.get(row(396).photoId), ["leaf"]);
  assert.ok(photos(catalog).find((photo) => photo.photoId === row(396).photoId).caption.includes("possivelmente galhas"));
});
