"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";
import { buildWhatsAppUrl } from "../utils/whatsapp";

/**
 * Mobile-only sticky bottom CTA. Slides up once the user scrolls past the
 * hero (#hero) and hides while the pricing section (#pricing) is on screen,
 * so we never show doubled CTAs.
 */
export function StickyCTABar() {
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang];
  const [pastHero, setPastHero] = useState(false);
  const [pricingInView, setPricingInView] = useState(false);

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const hero = document.getElementById("hero");

    if (hero) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          // Only count as "past" when the hero scrolled out above the viewport.
          setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
        },
        { threshold: 0 }
      );
      heroObserver.observe(hero);
      cleanups.push(() => heroObserver.disconnect());
    } else {
      // Fallback: no hero section found — use a scroll threshold instead.
      const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    const pricing = document.getElementById("pricing");
    if (pricing) {
      const pricingObserver = new IntersectionObserver(
        ([entry]) => setPricingInView(entry.isIntersecting),
        { threshold: 0.1 }
      );
      pricingObserver.observe(pricing);
      cleanups.push(() => pricingObserver.disconnect());
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const visible = pastHero && !pricingInView;

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0" : "translate-y-full pointer-events-none"
      )}
    >
      <div
        className="flex items-center gap-2 px-3 pt-2 bg-black/90 backdrop-blur-md border-t border-gray-800"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <Link
          href="/wizard"
          tabIndex={visible ? 0 : -1}
          className="flex-1 text-center px-4 py-3 rounded-xl bg-accent-cyan text-black font-bold text-sm leading-tight"
        >
          {t.stickyCta.createPlan}
        </Link>
        <a
          href={buildWhatsAppUrl(t.whatsapp.genericMessage)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.whatsapp.chatLabel}
          tabIndex={visible ? 0 : -1}
          className="w-12 h-12 shrink-0 rounded-xl bg-green-600 hover:bg-green-500 flex items-center justify-center text-white transition-colors"
        >
          <WhatsAppIcon className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
}
