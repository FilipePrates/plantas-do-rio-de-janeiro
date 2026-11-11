import type { Plant } from "./catalog.mjs";
export function createPlantSearch(plants: Plant[]): (query: string) => (plant: Plant) => boolean;
