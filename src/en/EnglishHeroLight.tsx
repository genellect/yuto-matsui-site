"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./english-founder.module.css";

// Mounts the WebGL light of the hero stage behind the copy and the prism
// wall. Until it is ready, or without WebGL, the CSS light stays in place.
export function EnglishHeroLight() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const hero = host?.closest<HTMLElement>("[data-hero-interface]");
    if (!host || !hero) return;
    let disposed = false;
    let cleanup = () => {};

    import("./hero-light-engine").then(({ mountHeroLight }) => {
      if (disposed) return;
      const light = mountHeroLight(host, {
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        finePointer: window.matchMedia("(pointer: fine)").matches,
        onReady: () => { if (!disposed) setReady(true); }
      });
      if (!light) return;

      const placeSource = () => {
        const gallery = hero.querySelector<HTMLElement>("[aria-roledescription='carousel']");
        const heroBox = hero.getBoundingClientRect();
        if (!gallery || heroBox.width === 0) return;
        const box = gallery.getBoundingClientRect();
        light.source((box.left - heroBox.left) / heroBox.width, 0.84);
        // The copy block, as uv (origin bottom-left), where the light stays low.
        const copy = Array.from(hero.querySelectorAll<HTMLElement>("h1, h1 ~ p, h1 ~ nav, h1 ~ p ~ nav, p:has(+ h1)"));
        if (copy.length) {
          const boxes = copy.map(node => node.getBoundingClientRect());
          const left = Math.min(...boxes.map(b => b.left)) - heroBox.left, right = Math.max(...boxes.map(b => b.right)) - heroBox.left;
          const top = Math.min(...boxes.map(b => b.top)) - heroBox.top, bottom = Math.max(...boxes.map(b => b.bottom)) - heroBox.top;
          light.quiet([left / heroBox.width, 1 - bottom / heroBox.height, right / heroBox.width, 1 - top / heroBox.height]);
        }
      };
      const onPointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const box = hero.getBoundingClientRect();
        light.pointer((event.clientX - box.left) / box.width, 1 - (event.clientY - box.top) / box.height, true);
      };
      const onLeave = () => light.pointer(0.6, 0.5, false);
      const onScroll = () => light.scroll(window.scrollY / Math.max(1, hero.offsetHeight));
      const pause = new MutationObserver(() => light.paused(hero.dataset.heroPaused === "true"));
      const resize = new ResizeObserver(placeSource);

      hero.addEventListener("pointermove", onPointer, { passive: true });
      hero.addEventListener("pointerleave", onLeave);
      window.addEventListener("scroll", onScroll, { passive: true });
      pause.observe(hero, { attributes: true, attributeFilter: ["data-hero-paused"] });
      resize.observe(hero);
      placeSource();
      onScroll();

      cleanup = () => {
        hero.removeEventListener("pointermove", onPointer);
        hero.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("scroll", onScroll);
        pause.disconnect();
        resize.disconnect();
        light.dispose();
      };
    }, () => {});

    return () => { disposed = true; cleanup(); };
  }, []);

  return <div ref={hostRef} className={styles.heroLight} data-ready={ready} aria-hidden="true" />;
}
