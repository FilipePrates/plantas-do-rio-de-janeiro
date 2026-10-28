import test from "node:test";
import assert from "node:assert/strict";
import { clampPhotoOffset, clampZoom, fitPhoto, focalOffset } from "../src/photoZoom.mjs";

test("contain sizing preserves square, portrait and landscape photos", () => {
  assert.deepEqual(fitPhoto(1000, 1000, 400, 600), { width: 400, height: 400 });
  assert.deepEqual(fitPhoto(600, 1200, 400, 600), { width: 300, height: 600 });
  assert.deepEqual(fitPhoto(1200, 600, 400, 600), { width: 400, height: 200 });
});

test("pinch keeps the same image point under a moving focal point", () => {
  const startScale = 1.5;
  const startOffset = -30;
  const startFocus = 80;
  const imagePoint = (startFocus - startOffset) / startScale;
  for (const scale of [1, 2, 3, 5]) {
    const focus = 110;
    const offset = focalOffset(startFocus, focus, startOffset, startScale, scale);
    assert.ok(Math.abs((focus - offset) / scale - imagePoint) < 1e-10);
  }
});

test("double tap targets the tapped detail and reset recentres the image", () => {
  assert.equal(focalOffset(80, 80, 0, 1, 2.5), -120);
  assert.equal(clampPhotoOffset(focalOffset(80, 80, -120, 2.5, 1), 400, 400, 1), 0);
});

test("pan bounds use the visible image, including letterboxed dimensions", () => {
  assert.equal(clampPhotoOffset(100, 400, 400, 1), 0);
  assert.equal(clampPhotoOffset(-100, 200, 600, 2), 0);
  assert.equal(clampPhotoOffset(1000, 400, 400, 3), 400);
  assert.equal(clampPhotoOffset(-1000, 400, 400, 3), -400);
  assert.equal(clampPhotoOffset(70, 400, 400, 3), 70);
  for (const scale of [1, 1.2, 2.5, 5]) {
    const limit = Math.max(0, (400 * scale - 400) / 2);
    for (const offset of [-2000, -1, 0, 1, 2000]) {
      assert.ok(Math.abs(clampPhotoOffset(offset, 400, 400, scale)) <= limit);
    }
  }
});

test("zoom is limited to the original size through 5x", () => {
  assert.equal(clampZoom(0.3), 1);
  assert.equal(clampZoom(2.5), 2.5);
  assert.equal(clampZoom(10), 5);
});
