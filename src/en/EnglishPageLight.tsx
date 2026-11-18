"use client";

import { useEffect, useRef } from "react";
import styles from "./english-founder.module.css";

// The light behind every section below the hero (page-light-engine.ts). Each
// section names its colours; the one in the middle of the screen sets them.
const sectionLight: Record<string, [string, string, number]> = {
  expertise: ["#8b78f0", "#4d7cff", 0.85],
  experience: ["#4d7cff", "#42d9ff", 0.8],
  fragments: ["#42d9ff", "#4d7cff", 1],
  statement: ["#a98bff", "#ff7ad9", 0.75],
  work: ["#4d7cff", "#8b78f0", 0.85],
  "off-hours": ["#ff9a7a", "#b06bff", 0.95],
  contact: ["#8b78f0", "#42d9ff", 1]
};

export function EnglishPageLight() {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};
    import("./page-light-engine").then(({ mountPageLight }) => {
      if (disposed) return;
      const light = mountPageLight(host, {
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        finePointer: window.matchMedia("(pointer: fine)").matches,
        coarse: window.matchMedia("(pointer: coarse)").matches
      });
      if (!light) return;
      host.dataset.ready = "true";
      const onPointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        light.pointer(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, true);
      };
      const onLeave = () => light.pointer(0.5, 0.5, false);
      const sections = Object.keys(sectionLight).map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
      const centre = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const [primary, secondary, strength] = sectionLight[entry.target.id];
          light.tint(primary, secondary, strength);
        }
      }, { rootMargin: "-45% 0px -45% 0px" });
      sections.forEach(section => centre.observe(section));
      // While the opaque hero fills the screen there is nothing to light.
      const hero = document.getElementById("top");
      const heroWatch = new IntersectionObserver(([entry]) => light.running(entry.intersectionRatio < 0.97), { threshold: [0, 0.97, 1] });
      if (hero) heroWatch.observe(hero);
      document.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      cleanup = () => {
        centre.disconnect();
        heroWatch.disconnect();
        document.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        light.dispose();
      };
    }, () => {});
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div ref={hostRef} className={styles.pageLight} aria-hidden="true" />;
}
