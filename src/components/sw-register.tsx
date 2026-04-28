"use client";

/**
 * Registers `/sw.js` as a root-scope service worker so Hero's Forge
 * is installable as a PWA and previously-opened tales remain readable
 * offline.
 *
 * Production-only by design: in `next dev` (Turbopack) a service
 * worker would intercept HMR requests and force hard reloads, so we
 * actively unregister any worker present during local development.
 */

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!("serviceWorker" in navigator)) return undefined;

    // In dev, tear down any worker left over from a prior production
    // run so HMR is never intercepted. See `public/sw.js` header.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const reg of regs) {
            reg.unregister().catch(() => undefined);
          }
        })
        .catch(() => undefined);
      return undefined;
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // When a new worker installs, prompt it to activate
          // immediately so users on a long session pick up the latest
          // shell on the next navigation.
          registration.addEventListener("updatefound", () => {
            const next = registration.installing;
            if (!next) return;
            next.addEventListener("statechange", () => {
              if (
                next.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                next.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch(() => {
          // Swallow registration errors — the app must remain usable
          // even when SW registration fails (private mode, unsupported
          // browser, etc.).
        });
    };

    if (document.readyState === "complete") {
      onLoad();
      return undefined;
    }
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
