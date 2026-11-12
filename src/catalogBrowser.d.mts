import type { ChecklistRow, Plant } from './catalog.mjs';
export type BrowserSection = 'families' | 'species' | 'units' | 'habitats';
export interface BrowserState {
  section: BrowserSection;
  family: string | null;
  origin: 'families' | null;
  queries: Record<BrowserSection, string>;
}
export type BrowserAction =
  | { type: 'restore'; state: BrowserState }
  | { type: 'tab'; section: BrowserSection }
  | { type: 'query'; query: string }
  | { type: 'select'; family: string }
  | { type: 'back' };
export const initialBrowserState: BrowserState;
export function browserReducer(state: BrowserState, action: BrowserAction): BrowserState;
export function filterBrowserRows(rows: ChecklistRow[], state: BrowserState): ChecklistRow[];
export function rowsForConservationUnit(rows: ChecklistRow[], name: string): ChecklistRow[];
export interface CatalogIndexEntry { name: string; speciesCount: number }
export function conservationUnitIndex(rows: ChecklistRow[]): CatalogIndexEntry[];
export function matchesIndexName(name: string, query: string): boolean;
export function plantsForRows(rows: ChecklistRow[]): Plant[];
