"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToHashElement } from "@/lib/scroll-to-hash";

/** Scroll to `location.hash` after landing on `/` (footer / nav deep links). */
export function HashScrollOnLoad() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const scrollFromHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      requestAnimationFrame(() => {
        scrollToHashElement(id);
      });
    };

    scrollFromHash();
    window.addEventListener("hashchange", scrollFromHash);
    return () => window.removeEventListener("hashchange", scrollFromHash);
  }, [pathname]);

  return null;
}
