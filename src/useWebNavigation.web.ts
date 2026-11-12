import { useCallback, useEffect, useRef } from 'react';
import { defaultWebRoute, webRoutePageKey, webRouteSearch } from './webRoute.mjs';
import type { WebRoute } from './webRoute.mjs';

export function useWebNavigation(route: WebRoute, ready: boolean, restore: (route: WebRoute) => void,
  read: (search: string) => WebRoute | null): () => boolean {
  const current = useRef(route);
  current.current = route;
  const initialized = useRef(false);
  const pending = useRef<{ search: string; scrollTop: number } | null>(null);
  const scroll = useRef<{ search: string; value: number } | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreFrame = useRef<number | null>(null);
  const restoringScroll = useRef(false);
  const cancelScrollRestore = useCallback(() => {
    if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current);
    restoreFrame.current = null;
    restoringScroll.current = false;
  }, []);
  const flushScroll = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = null;
    if (scroll.current?.search === location.search) {
      history.replaceState({ ...history.state, profileScrollTop: scroll.current.value }, '');
    }
    scroll.current = null;
  }, []);

  useEffect(() => {
    if (!ready) return;
    const initial = read(location.search);
    if (initial) {
      pending.current = { search: webRouteSearch(initial), scrollTop: history.state?.profileScrollTop ?? 0 };
      restore(initial);
    } else {
      history.replaceState({ ...history.state, plantRoute: current.current, plantDepth: 0, profileScrollTop: 0 }, '',
        location.pathname + webRouteSearch(current.current));
    }
    initialized.current = true;
    function capturePosition() {
      cancelScrollRestore();
      const element = document.querySelector<HTMLElement>('[data-testid="plant-profile-scroll"]');
      if (element && current.current.plantId && location.search === webRouteSearch(current.current)) {
        scroll.current = { search: location.search, value: element.scrollTop };
        flushScroll();
      }
    }
    function pop(event: PopStateEvent) {
      scroll.current = null;
      const next = read(location.search) ?? defaultWebRoute();
      pending.current = { search: webRouteSearch(next), scrollTop: event.state?.profileScrollTop ?? 0 };
      restore(next);
    }
    function trackScroll(event: Event) {
      if (pending.current || restoringScroll.current) return;
      if (webRouteSearch(current.current) !== location.search) return;
      const target = event.target as HTMLElement;
      if (target?.getAttribute?.('data-testid') !== 'plant-profile-scroll') return;
      scroll.current = { search: location.search, value: target.scrollTop };
      history.replaceState({ ...history.state, profileScrollTop: target.scrollTop }, '');
      if (!scrollTimer.current) scrollTimer.current = setTimeout(flushScroll, 250);
    }
    window.addEventListener('popstate', pop);
    document.addEventListener('scroll', trackScroll, true);
    document.addEventListener('click', capturePosition, true);
    return () => {
      window.removeEventListener('popstate', pop);
      document.removeEventListener('scroll', trackScroll, true);
      document.removeEventListener('click', capturePosition, true);
      cancelScrollRestore();
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [ready, read, restore, flushScroll, cancelScrollRestore]);

  useEffect(() => {
    if (!ready || !initialized.current) return;
    const search = webRouteSearch(route);
    if (pending.current) {
      if (search !== pending.current.search) return;
      const top = pending.current.scrollTop;
      pending.current = null;
      history.replaceState({ ...history.state, plantRoute: route, plantDepth: history.state?.plantDepth ?? 0, profileScrollTop: top }, '', location.pathname + search);
      // New keyed profiles start at zero. A deferred zero reset can overwrite a
      // user's first scroll or even run against the following profile.
      cancelScrollRestore();
      if (top <= 0) return;
      restoringScroll.current = true;
      let attempts = 0;
      const restoreScroll = () => {
        if (location.search !== search || webRouteSearch(current.current) !== search) { cancelScrollRestore(); return; }
        const element = document.querySelector<HTMLElement>('[data-testid="plant-profile-scroll"]');
        if (element && element.scrollHeight - element.clientHeight >= top) {
          element.scrollTop = top;
          cancelScrollRestore();
        } else if (attempts++ < 120) restoreFrame.current = requestAnimationFrame(restoreScroll);
        else cancelScrollRestore();
      };
      restoreFrame.current = requestAnimationFrame(() => { restoreFrame.current = requestAnimationFrame(restoreScroll); });
      return cancelScrollRestore;
    }
    if (location.search === search) return;
    flushScroll();
    const previous = read(location.search);
    const replace = previous && webRoutePageKey(previous) === webRoutePageKey(route);
    if (replace) history.replaceState({ ...history.state, plantRoute: route }, '', location.pathname + search);
    else history.pushState({ plantRoute: route, plantDepth: (history.state?.plantDepth ?? 0) + 1, profileScrollTop: 0 }, '', location.pathname + search);
  }, [route, ready, read, flushScroll, cancelScrollRestore]);

  return useCallback(() => {
    if (!initialized.current || !(history.state?.plantDepth > 0)) return false;
    flushScroll();
    history.back();
    return true;
  }, [flushScroll]);
}
