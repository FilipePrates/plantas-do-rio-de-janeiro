import type { Catalog } from './catalog.mjs';
import type { BrowserState } from './catalogBrowser.mjs';
import type { MainPhoto, PrincipalName } from './presentation.mjs';
export interface WebRoute {
  tab: 'guide' | 'families' | 'habitats'; plantId: string | null; settings: boolean;
  query: string; habitat: string; familyFilter: string | null;
  scope: { kind: 'unit' | 'family'; name: string } | null;
  browser: BrowserState;
  preferences: { photosOnly: boolean; alphabetical: boolean; principalName: PrincipalName; advanced: boolean; mainPhoto: MainPhoto };
  columns: number;
}
export function defaultWebRoute(): WebRoute;
export function createWebRouteReader(catalog: Catalog): (search: string) => WebRoute | null;
export function webRouteSearch(route: WebRoute): string;
export function webRoutePageKey(route: WebRoute): string;
export function conservationUnitHref(name: string): string;
