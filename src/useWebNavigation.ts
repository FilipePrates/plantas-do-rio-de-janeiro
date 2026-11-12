import type { WebRoute } from './webRoute.mjs';

// Native apps keep their existing state navigation and hardware Back handling.
export function useWebNavigation(_route: WebRoute, _ready: boolean, _restore: (route: WebRoute) => void,
  _read: (search: string) => WebRoute | null): () => boolean {
  return () => false;
}
