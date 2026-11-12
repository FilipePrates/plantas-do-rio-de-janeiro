import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { normalizeMainPhoto } from "./presentation.mjs";
import type { MainPhoto, PrincipalName } from "./presentation.mjs";
import type { Plant } from "./catalog.mjs";
import { resolveSavedIds } from "./catalog.mjs";

const key = "plantas-do-rio-state-v1";
export interface SavedList {
  id: string;
  name: string;
  plantIds: string[];
}
export interface SavedState {
  advanced: boolean;
  alphabetical: boolean;
  photosOnly: boolean;
  principalName: PrincipalName;
  mainPhoto: MainPhoto;
  desktopColumns: number;
  // Retain legacy lists on disk when updating preferences.
  lists: SavedList[];
  familyFilter: string | null;
}
export const defaultState: SavedState = {
  advanced: false,
  alphabetical: false,
  photosOnly: true,
  principalName: "common",
  mainPhoto: "default",
  desktopColumns: 10,
  familyFilter: null,
  lists: [{ id: "minha-lista", name: "Minha lista", plantIds: [] }],
};
export async function loadState(
  validIds: Set<string>,
  validFamilies: Set<string>,
  plants?: Plant[],
): Promise<SavedState> {
  const raw =
    Platform.OS === "web"
      ? localStorage.getItem(key)
      : await (async () => {
          const file = new File(Paths.document, key + ".json");
          return file.exists ? file.text() : null;
        })();
  if (!raw) return defaultState;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object")
    throw new Error("Estado local inválido.");
  const value = parsed as Partial<SavedState>;
  if (
    !Array.isArray(value.lists) ||
    value.lists.length === 0 ||
    typeof value.advanced !== "boolean" ||
    typeof value.alphabetical !== "boolean"
  )
    throw new Error("Estado local inválido.");
  const ids = new Set<string>();
  const lists = value.lists.map((list) => {
    if (
      !list ||
      typeof list.id !== "string" ||
      ids.has(list.id) ||
      typeof list.name !== "string" ||
      !list.name.trim() ||
      !Array.isArray(list.plantIds) ||
      !list.plantIds.every((id) => typeof id === "string")
    )
      throw new Error("Lista local inválida.");
    ids.add(list.id);
    return {
      id: list.id,
      name: list.name.slice(0, 80),
      plantIds: plants ? resolveSavedIds(list.plantIds, plants) :
        [...new Set(list.plantIds.filter((id) => validIds.has(id)))],
    };
  });
  return {
    advanced: value.advanced,
    alphabetical: value.alphabetical,
    photosOnly: typeof value.photosOnly === "boolean" ? value.photosOnly : defaultState.photosOnly,
    principalName:
      value.principalName === "scientific" ? "scientific" : "common",
    mainPhoto: normalizeMainPhoto(value.mainPhoto),
    desktopColumns:
      Number.isInteger(value.desktopColumns) && value.desktopColumns! >= 6 && value.desktopColumns! <= 22
        ? value.desktopColumns!
        : defaultState.desktopColumns,
    lists,
    familyFilter:
      typeof value.familyFilter === "string" &&
      validFamilies.has(value.familyFilter)
        ? value.familyFilter
        : null,
  };
}
export function saveState(state: SavedState) {
  const json = JSON.stringify(state);
  if (Platform.OS === "web") localStorage.setItem(key, json);
  else {
    const file = new File(Paths.document, key + ".json");
    if (!file.exists) file.create({ intermediates: true });
    file.write(json);
  }
}
