import type { Catalog } from './catalog.mjs';
import type { BrowserState } from './catalogBrowser.mjs';
export interface WebRoute {
  tab: 'guide' | 'families' | 'habitats'; plantId: string | null; settings: boolean;
  query: string; habitat: string; familyFilter: string | null;
  scope: { kind: 'unit' | 'family'; name: string } | null;
  browser: BrowserState;
}
export function defaultWebRoute(): WebRoute;
export function createWebRouteReader(catalog: Catalog): (search: string) => WebRoute | null;
export function webRouteSearch(route: WebRoute): string;
export function webRoutePageKey(route: WebRoute): string;
export function conservationUnitHref(name: string): string;
