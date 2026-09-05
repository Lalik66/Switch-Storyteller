"use client";

import { useSyncExternalStore } from "react";

/**
 * True on the client, false during SSR. Use to gate auth/session UI so the
 * server HTML matches the first client render (avoids hydration mismatch).
 */
export function useClientMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
