import { normalize, plantSearchText } from "./catalog.mjs";

// The guide's catalog is immutable. Prepare its normalized text once, while
// leaving the shared matcher safe for mutable editor drafts.
export function createPlantSearch(plants) {
  const text = new Map(plants.map((plant) => [plant, plantSearchText(plant)]));
  return (query) => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return (plant) => {
      const haystack = text.get(plant) ?? plantSearchText(plant);
      return terms.every((term) => haystack.includes(term));
    };
  };
}
