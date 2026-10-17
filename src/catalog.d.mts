export type PhotoMarker =
  | "flower"
  | "fruit"
  | "leaf"
  | "bark"
  | "wholePlant"
  | "seed"
  | "root"
  | "unknown";
export type ReviewStatus = "draft" | "reviewed";
export interface Source {
  title: string;
  url: string;
  retrievedAt: string;
}
export interface RegionalSpecies {
  scientificName: string;
  floraId: number;
  lifeForms: string[];
  substrates: string[];
}
export type ConservationCategory = "EX" | "EW" | "CR" | "EN" | "VU" | "NT" | "LC" | "DD" | "NE";
export interface RegionalEvidence {
  scientificName: string;
  publicationYear: number;
  source: Source;
  conservationUnits: {
    name: string;
    voucher: string;
    /** One-based PDF page, including its cover. */
    sourcePage: number;
    /** Present only when the source places the entire unit in this municipality. */
    municipality?: string;
    municipalitySourcePage?: number;
  }[];
  conservationAssessments: {
    category: ConservationCategory;
    scope: "brazil" | "rio-state" | "global" | "unspecified";
    referenceYear: number;
    referenceTitle: string;
    sourcePage: number;
  }[];
  /** An absent value means unknown, never false. */
  endemicToRioState?: true;
}
export interface PlantPhoto {
  id: string;
  fileName: string;
  photoId: number;
  observationId: number;
  taxonId: number;
  taxonName: string;
  creator: string;
  license: "CC0-1.0";
  licenseCode: "cc0";
  sourceUrl: string;
  observationUrl: string;
  downloadedAt: string;
  sha256: string;
  markers: PhotoMarker[];
  caption: string;
  reviewStatus: ReviewStatus;
}
export interface Plant {
  id: string;
  scientificName: string;
  authorship: string;
  commonName: string;
  alternateNames: string[];
  family: string;
  genus: string;
  rank: "species" | "genus";
  origin: "native" | "introduced" | "invasive";
  geography: "rio-city" | "rio-state";
  reviewStatus: ReviewStatus;
  description: string;
  identification: string;
  ecology: string;
  lifeForms: string[];
  substrates: string[];
  habitats: string[];
  floraId: number | null;
  regionalSpecies: RegionalSpecies[];
  regionalEvidence?: RegionalEvidence[];
  sources: Source[];
  photos: PlantPhoto[];
  curationNotes: string;
}
export interface Catalog {
  schemaVersion: 1;
  title: string;
  updatedAt: string;
  maxSpecies: 1500;
  scope: string;
  plants: Plant[];
}
export const markerLabels: Record<PhotoMarker, string>;
export const conservationLabels: Record<ConservationCategory, string>;
export function parseCatalog(value: unknown): Catalog;
export function representedSpeciesCount(catalog: Catalog): number;
export function normalize(value: string): string;
export function matchesPlant(plant: Plant, query: string): boolean;

export const originLabels: Record<Plant["origin"], string>;
export const markerPaths: Record<Exclude<PhotoMarker, "unknown">, string>;

export function photoMatchesPlant(plant: Plant, taxonName: string): boolean;
