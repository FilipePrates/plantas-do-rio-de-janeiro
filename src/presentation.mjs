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

export const mainPhotoKinds = ["default", "flower", "fruit", "leaf", "bark", "wholePlant", "seed", "root"];

export function normalizeMainPhoto(value) {
  return mainPhotoKinds.includes(value) ? value : "default";
}

export function getMainPhoto(plant, preference = "default") {
  return plant.photos.find((photo) => photo.markers.includes(preference)) ?? plant.photos[0];
}
