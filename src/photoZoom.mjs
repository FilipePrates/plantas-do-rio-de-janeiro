export const MAX_PHOTO_ZOOM = 5;

export function clampZoom(scale) {
  "worklet";
  return Math.max(1, Math.min(MAX_PHOTO_ZOOM, scale));
}

// Use the contained image size, so portrait/landscape letterboxing cannot be
// dragged into view as empty space at high zoom.
export function fitPhoto(width, height, viewportWidth, viewportHeight) {
  "worklet";
  const ratio = Math.min(viewportWidth / width, viewportHeight / height);
  return { width: width * ratio, height: height * ratio };
}

export function clampPhotoOffset(offset, imageSize, viewportSize, scale) {
  "worklet";
  const limit = Math.max(0, (imageSize * scale - viewportSize) / 2);
  if (limit === 0) return 0;
  return Math.max(-limit, Math.min(limit, offset));
}

// Coordinates are relative to the viewport centre. Keep the image point under
// the starting finger at the current finger position throughout the pinch.
export function focalOffset(startFocus, focus, startOffset, startScale, scale) {
  "worklet";
  return focus - (startFocus - startOffset) * (scale / startScale);
}
