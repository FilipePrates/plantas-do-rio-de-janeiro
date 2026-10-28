export const MAX_PHOTO_ZOOM: number;
export function clampZoom(scale: number): number;
export function fitPhoto(width: number, height: number, viewportWidth: number, viewportHeight: number): { width: number; height: number };
export function clampPhotoOffset(offset: number, imageSize: number, viewportSize: number, scale: number): number;
export function focalOffset(startFocus: number, focus: number, startOffset: number, startScale: number, scale: number): number;
