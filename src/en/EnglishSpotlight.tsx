"use client";

import { useEffect } from "react";

// Light that answers the mouse, in three layers:
// - the black of the page: a soft light follows the pointer across section
//   backgrounds (`--cx`/`--cy` on the page, drawn behind all content);
// - lit panels: light gathers under the pointer and runs along the edge;
// - photo frames: the frame turns a few degrees towards the pointer. Copy and
//   the photographs themselves never move, so reading is unaffected.
// Touch and reduced motion keep everything still.
const panels = "[data-spotlight], [data-products-cinematic][data-language='en'] article > div:first-child";
const frames = "[data-english-founder-page] [data-depth-visual], [data-tilt-frame]";
const MAX_TILT_X = 6;
const MAX_TILT_Y = 8;

export function EnglishSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const page = document.querySelector<HTMLElement>("[data-english-founder-page]");
    let lit: HTMLElement | null = null;
    let tilted: HTMLElement | null = null;
    let frame = 0;
    const release = (element: HTMLElement | null) => {
      if (!element) return;
      element.style.setProperty("--tilt-x", "0deg");
      element.style.setProperty("--tilt-y", "0deg");
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        page?.style.setProperty("--cx", `${event.clientX}px`);
        page?.style.setProperty("--cy", `${event.clientY}px`);
        const target = event.target as Element | null;

        const panel = target?.closest<HTMLElement>(panels) ?? null;
        if (lit && lit !== panel) { lit.dataset.lit = "false"; lit.style.setProperty("--spot-on", "0"); }
        lit = panel;
        if (panel) {
          const box = panel.getBoundingClientRect();
          panel.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
          panel.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
          panel.style.setProperty("--spot-on", "1");
          panel.dataset.lit = "true";
        }

        const photo = target?.closest<HTMLElement>(frames) ?? null;
        if (tilted !== photo) release(tilted);
        tilted = photo;
        if (photo) {
          const box = photo.getBoundingClientRect();
          const x = (event.clientX - box.left) / box.width - 0.5;
          const y = (event.clientY - box.top) / box.height - 0.5;
          photo.style.setProperty("--tilt-x", `${(-y * 2 * MAX_TILT_X).toFixed(2)}deg`);
          photo.style.setProperty("--tilt-y", `${(x * 2 * MAX_TILT_Y).toFixed(2)}deg`);
        }
      });
    };
    const onLeave = () => {
      page?.style.setProperty("--cx", "-9999px");
      release(tilted);
      tilted = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
