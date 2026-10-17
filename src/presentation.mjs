export function getPlantName(plant, principalName) {
  return principalName === "scientific"
    ? plant.scientificName
    : plant.commonName;
}

// Same explicit hyphen break used by Aves do Brasil's Portuguese name labels.
export function formatPlantNameForWrap(name, principalName = "common") {
  return principalName === "scientific"
    ? name
    : name.replaceAll("-", "-\u200B");
}
