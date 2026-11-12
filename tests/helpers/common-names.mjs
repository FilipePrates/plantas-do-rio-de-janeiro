// Historical snapshots retain their original data. Compare only the explicitly
// requested scientific-name placeholder cleanup; all other fields stay exact.
export function withoutRepeatedCommonNames(catalog) {
  return { ...catalog, plants: catalog.plants.map(plant => ({
    ...plant,
    commonName: plant.commonName.trim().toLocaleLowerCase("pt-BR") === plant.scientificName.trim().toLocaleLowerCase("pt-BR") ? "" : plant.commonName,
  })) };
}
