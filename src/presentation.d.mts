import type { Plant, PlantPhoto, PhotoMarker } from "./catalog.mjs";
export type PrincipalName = "common" | "scientific";
export function getPlantName(
  plant: Plant,
  principalName: PrincipalName,
): string;
export function formatPlantNameForWrap(
  name: string,
  principalName?: PrincipalName,
): string;

export type MainPhoto = "default" | Exclude<PhotoMarker, "unknown">;
export const mainPhotoKinds: MainPhoto[];
export function normalizeMainPhoto(value: unknown): MainPhoto;
export function getMainPhoto(plant: Plant, preference?: MainPhoto): PlantPhoto | undefined;

export function hasCommonName(plant: Plant): boolean;
