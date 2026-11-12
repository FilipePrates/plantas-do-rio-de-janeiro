export function hasCommonName(plant) {
  return !!plant.commonName.trim() && plant.commonName.trim().toLocaleLowerCase("pt-BR") !== plant.scientificName.trim().toLocaleLowerCase("pt-BR");
}

export function getPlantName(plant, principalName) {
  return principalName === "scientific"
    ? plant.scientificName
    : hasCommonName(plant) ? plant.commonName : plant.scientificName;
}

// Same explicit hyphen break used by Aves do Brasil's Portuguese name labels.
export function formatPlantNameForWrap(name, principalName = "common") {
  return principalName === "scientific"
    ? name
    : name.replaceAll("-", "-\u200B");
}

export const mainPhotoKinds = ["default", "flower", "fruit", "leaf", "bark", "wholePlant", "seed", "root"];

export function normalizeMainPhoto(value) {
  return mainPhotoKinds.includes(value) ? value : "default";
}

export function getMainPhoto(plant, preference = "default") {
  return plant.photos.find((photo) => photo.markers.includes(preference)) ?? plant.photos[0];
}
