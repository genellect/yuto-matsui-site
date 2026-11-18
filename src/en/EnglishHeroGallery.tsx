"use client";

import { controls as enControls, heroCopy, heroSlides } from "../content/en";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { frame } from "./hero-framing";
import type { PrismController } from "./hero-prism-engine";
import styles from "./english-founder.module.css";

const intervalMs = 8_000;
const transitionMs = 1_040;
const segmentCount = 12;

type SegmentStyle = CSSProperties & {
  "--segment-delay": string;
  "--segment-image": string;
  "--segment-mobile-image": string;
  "--segment-left": string;
  "--segment-mobile-position": string;
  "--segment-position": string;
  "--segment-right": string;
};

export function EnglishHeroGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [enteringIndex, setEnteringIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const nextSlideRef = useRef<() => void>(() => {});
  const visualRef = useRef<HTMLDivElement>(null);
  const prismRef = useRef<PrismController | null>(null);
  const activeRef = useRef(0);
  const [prism, setPrism] = useState<"loading" | "ready" | "failed">("loading");
  const [mobile, setMobile] = useState(false);
  const [crops, setCrops] = useState<{ position: string; zoom: number; origin: string }[] | null>(null);

  const showSlide = useCallback((nextIndex: number) => {
    if (nextIndex === activeIndex || enteringIndex !== null) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveIndex(nextIndex);
      setCycle((current) => current + 1);
      return;
    }

    setEnteringIndex(nextIndex);
    setCycle((current) => current + 1);

    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      setActiveIndex(nextIndex);
      setEnteringIndex(null);
      transitionTimer.current = null;
    }, transitionMs);
  }, [activeIndex, enteringIndex]);

  const showPrevious = useCallback(() => {
    showSlide((activeIndex - 1 + heroSlides.length) % heroSlides.length);
  }, [activeIndex, showSlide]);

  const showNext = useCallback(() => {
    showSlide((activeIndex + 1) % heroSlides.length);
  }, [activeIndex, showSlide]);

  useEffect(() => { nextSlideRef.current = showNext; }, [showNext]);

  // Each portrait is cropped around the face for the frame it fills, the same
  // way the prism wall crops it, so the two never disagree.
  useEffect(() => {
    const host = visualRef.current;
    if (!host) return;
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => {
      const box = host.getBoundingClientRect();
      const small = media.matches;
      setMobile(small);
      setCrops(heroSlides.map(slide => {
        const variant = small ? slide.mobile : slide;
        const crop = frame(variant.focus, variant.size, [box.width, box.height], small);
        return { position: crop.objectPosition, zoom: crop.zoom, origin: crop.origin };
      }));
    };
    const observer = new ResizeObserver(update);
    observer.observe(host);
    media.addEventListener("change", update);
    update();
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);

  // The prism wall carries the same photographs in WebGL. Until it is ready,
  // or when WebGL is unavailable, the HTML images remain the portrait.
  useEffect(() => {
    const host = visualRef.current;
    if (!host) return;
    let disposed = false;
    import("./hero-prism-engine").then(({ mountPrismWall }) => {
      if (disposed) return;
      prismRef.current = mountPrismWall(host, heroSlides, activeRef.current, {
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        onReady: () => { if (!disposed) setPrism("ready"); },
        onFail: () => { if (!disposed) setPrism("failed"); }
      });
    }, () => setPrism("failed"));
    return () => { disposed = true; prismRef.current?.dispose(); prismRef.current = null; };
  }, []);

  useEffect(() => {
    activeRef.current = activeIndex;
    prismRef.current?.show(activeIndex, false);
  }, [activeIndex]);

  useEffect(() => {
    if (enteringIndex !== null) prismRef.current?.show(enteringIndex, true);
  }, [enteringIndex]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) nextSlideRef.current();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  useEffect(() => {
    const hero = rootRef.current?.closest<HTMLElement>("[data-hero-interface]");
    if (!hero) return;
    hero.dataset.heroCycle = String(cycle % 2);
    hero.dataset.heroPaused = String(paused);
  }, [cycle, paused]);

  useEffect(() => {
    const hero = rootRef.current?.closest<HTMLElement>("[data-hero-interface]");
    const precisePointer = window.matchMedia("(pointer: fine)");
    if (!hero || !precisePointer.matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const updatePointer = (event: PointerEvent) => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        hero.style.setProperty("--hero-shift-x", `${(x * 6).toFixed(2)}px`);
        hero.style.setProperty("--hero-shift-y", `${(y * 4).toFixed(2)}px`);
      });
    };
    const resetPointer = () => {
      hero.style.setProperty("--hero-shift-x", "0px");
      hero.style.setProperty("--hero-shift-y", "0px");
    };

    hero.addEventListener("pointermove", updatePointer, { passive: true });
    hero.addEventListener("pointerleave", resetPointer);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", updatePointer);
      hero.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    pointerOrigin.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = pointerOrigin.current;
    pointerOrigin.current = null;
    if (!origin || event.pointerType === "mouse") return;

    const distanceX = event.clientX - origin.x;
    const distanceY = event.clientY - origin.y;
    if (Math.abs(distanceX) < 48 || Math.abs(distanceX) < Math.abs(distanceY) * 1.25) return;
    if (distanceX > 0) showPrevious();
    else showNext();
  };

  const enteringSlide = enteringIndex === null ? null : heroSlides[enteringIndex];
  const displayIndex = enteringIndex ?? activeIndex;

  return (
    <div
      ref={rootRef}
      className={styles.heroGallery}
      data-cycle={cycle % 2}
      data-transitioning={enteringIndex !== null}
      role="region"
      aria-roledescription="carousel"
      aria-label={heroCopy.heroGallery}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showPrevious();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          showNext();
        }
      }}
    >
      <div
        ref={visualRef}
        className={styles.heroVisual}
        data-prism={prism}
        aria-live="off"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerOrigin.current = null; }}
      >
        {heroSlides.map((slide, index) => (
          <figure
            key={slide.src + index}
            className={styles.heroSlide}
            data-active={activeIndex === index}
            aria-hidden={activeIndex !== index}
          >
            <picture>
              <source media="(max-width: 700px)" srcSet={slide.mobile.src} />
              <img
                src={slide.src}
                alt={activeIndex === index ? (mobile ? slide.mobile.alt : slide.alt) : ""}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                style={{
                  "--hero-position": crops?.[index]?.position ?? slide.position,
                  "--hero-mobile-position": crops?.[index]?.position ?? slide.mobilePosition,
                  "--hero-zoom": crops?.[index]?.zoom ?? 1,
                  "--hero-origin": crops?.[index]?.origin ?? "50% 50%"
                } as CSSProperties}
              />
            </picture>
          </figure>
        ))}

        {enteringSlide ? (
          <div className={styles.heroTransitionLayer} aria-hidden="true">
            {Array.from({ length: segmentCount }, (_, index) => {
              const start = (index * 100) / segmentCount;
              const end = ((index + 1) * 100) / segmentCount;
              const style: SegmentStyle = {
                "--segment-delay": `${index * 21}ms`,
                "--segment-image": `url(${enteringSlide.src})`,
                "--segment-mobile-image": `url(${enteringSlide.mobile.src})`,
                "--segment-left": `${start}%`,
                "--segment-mobile-position": crops?.[enteringIndex!]?.position ?? enteringSlide.mobilePosition,
                "--segment-position": crops?.[enteringIndex!]?.position ?? enteringSlide.position,
                "--segment-right": `${100 - end}%`
              };
              return <span key={`${enteringSlide.src}-${index}`} style={style} />;
            })}
          </div>
        ) : null}

        <span className={styles.heroVisualGradient} aria-hidden="true" />
        <span className={styles.heroSignalBoundary} aria-hidden="true" />
      </div>

      <div className={styles.heroSystemRail}>
        <div className={styles.heroProgress} aria-label={heroCopy.heroProgress}>
          {heroSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show portrait ${index + 1}`}
              aria-pressed={activeIndex === index && enteringIndex === null}
              data-active={activeIndex === index && enteringIndex === null}
              data-entering={enteringIndex === index}
              onClick={() => showSlide(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <span className={styles.heroGalleryMeta} aria-hidden="true">
          {String(displayIndex + 1).padStart(2, "0")}{heroCopy.heroGalleryMeta}{String(heroSlides.length).padStart(2, "0")}{heroCopy.heroGalleryMeta2}{heroSlides[displayIndex].label}
        </span>
        <span className={styles.heroCoordinates} aria-hidden="true">{heroCopy.heroCoordinates}</span>
        <button
          type="button"
          className={styles.heroPause}
          aria-label={paused ? enControls.resumePortraits : enControls.pausePortraits}
          aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}
        >
          <span aria-hidden="true">{paused ? enControls.portraitPlay : enControls.portraitPause}</span>
        </button>
      </div>
    </div>
  );
}
