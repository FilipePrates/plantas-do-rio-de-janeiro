import type { Plant } from "./catalog.mjs";
export type PrincipalName = "common" | "scientific";
export function getPlantName(
  plant: Plant,
  principalName: PrincipalName,
): string;
export function formatPlantNameForWrap(
  name: string,
  principalName?: PrincipalName,
): string;
