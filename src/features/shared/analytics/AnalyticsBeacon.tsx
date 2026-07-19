"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "./track";

/**
 * Mounted once in the root layout (client component, safe with static
 * export). Sends page_view on every route change, Core Web Vitals once per
 * page load, and whatsapp_click via a delegated listener so every wa.me
 * anchor (including ones in server components) is covered without per-site
 * wiring. Anonymous: no PII, no cookies, no user ids.
 */
export function AnalyticsBeacon() {
  const pathname = usePathname();

  // page_view on initial load and on every client-side navigation.
  useEffect(() => {
    track("page_view");
  }, [pathname]);

  useEffect(() => {
    // Core Web Vitals (lazy-loaded so it never blocks rendering).
    let cancelled = false;
    import("web-vitals").then(({ onLCP, onCLS, onINP }) => {
      if (cancelled) return;
      onLCP((m) => track("web_vital_lcp", m.value));
      onCLS((m) => track("web_vital_cls", m.value));
      onINP((m) => track("web_vital_inp", m.value));
    });

    // Delegated whatsapp_click: catches every wa.me anchor app-wide.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="https://wa.me/"]'
      );
      if (anchor) track("whatsapp_click");
    };
    document.addEventListener("click", onClick, { capture: true });

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}
