import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * Reads a browser-only value (storage, media queries) without a hydration mismatch:
 * the server and first client render use `serverValue`, then React switches to the real one.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noSubscribe, read, () => serverValue);
}

/** Subscribes to a CSS media query. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
