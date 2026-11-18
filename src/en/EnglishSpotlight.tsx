"use client";

import { useEffect } from "react";

// Lit panels: where a mouse pointer rests on a panel, light gathers under it
// and runs along its edge. Touch and reduced motion keep the still panels.
const targets = "[data-spotlight], [data-products-cinematic][data-language='en'] article > div:first-child";

export function EnglishSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lit: HTMLElement | null = null;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const element = (event.target as Element | null)?.closest<HTMLElement>(targets) ?? null;
        if (lit && lit !== element) lit.dataset.lit = "false";
        lit = element;
        if (!element) return;
        const box = element.getBoundingClientRect();
        element.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
        element.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
        element.dataset.lit = "true";
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointermove", onMove); };
  }, []);
  return null;
}
