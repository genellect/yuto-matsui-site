"use client";

import { controls as jaControls, heroCopy, heroMobileSecondSlide, heroSlides as SLIDES } from "../content/ja";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MobileHeroRibbons } from "./MobileHeroRibbons";
import styles from "./founder.module.css";
import { busStopPortraitComposition, cameraPortraitComposition } from "./hero-composition";

const INTERVAL_MS = 5200;

export function FounderHeroGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const gallery = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = gallery.current?.querySelector<HTMLElement>(`.${styles.photoFrame}`);
    const crop = gallery.current?.querySelector<HTMLElement>("[data-composition='camera-portrait']");
    if (!frame || !crop) return;
    const sync = () => {
      const { width, height } = frame.getBoundingClientRect();
      if (!width || !height) return;
      const composition = cameraPortraitComposition(width, height);
      for (const [name, value] of Object.entries(composition)) crop.style.setProperty(`--portrait-${name}`, `${value}px`);
      const mobile = busStopPortraitComposition(width, height);
      for (const [name, value] of Object.entries(mobile)) crop.style.setProperty(`--mobile-portrait-${name}`, `${value}px`);
    };
    const observer = new ResizeObserver(sync);
    observer.observe(frame);
    sync();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 640px)");
    const hero = gallery.current?.parentElement;
    const copy = hero?.querySelector<HTMLElement>(`.${styles.heroCopy}`);
    const header = hero?.closest(`.${styles.page}`)?.querySelector<HTMLElement>(`.${styles.header}`);
    if (!hero || !copy) return;
    const sync = () => {
      if (!mobile.matches) {
        hero.style.removeProperty("--hero-copy-height");
        hero.style.removeProperty("--hero-header-height");
        return;
      }
      hero.style.setProperty("--hero-copy-height", `${copy.offsetHeight}px`);
      if (header) hero.style.setProperty("--hero-header-height", `${header.offsetHeight}px`);
    };
    const observer = new ResizeObserver(sync);
    observer.observe(copy);
    if (header) observer.observe(header);
    sync();
    mobile.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", sync);
      hero.style.removeProperty("--hero-copy-height");
      hero.style.removeProperty("--hero-header-height");
    };
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (!document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setActiveIndex((current) => (current + 1) % SLIDES.length);
      }
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      ref={gallery}
      className={styles.heroPhoto}
      role="region"
      aria-roledescription="carousel"
      aria-label={heroCopy.heroPhoto}
      data-paused={paused}
    >
      <div className={styles.photoFrame} aria-live="off">
        {SLIDES.map((slide, index) => (
          <figure
            key={slide.src}
            className={styles.photoSlide}
            data-active={index === activeIndex}
            data-motion={slide.motion}
            data-focus={slide.focus}
            data-composition={index === 1 ? "camera-portrait" : undefined}
            aria-hidden={index !== activeIndex}
          >
            {index === 1 ? <>
              <div className={styles.lakePortraitLayer}>
                <Image src={slide.src} alt={index === activeIndex ? slide.alt : ""} width={1333} height={2000} priority sizes="(min-width: 901px) 88vw, 180vw" />
              </div>
              <div className={styles.mobilePortraitLayer}>
                <Image src={heroMobileSecondSlide.src} alt={index === activeIndex ? heroMobileSecondSlide.alt : ""} width={2000} height={1333} loading="lazy" sizes="300vw" />
              </div>
            </> : <Image
              src={slide.src}
              alt={index === activeIndex ? slide.alt : ""}
              fill
              priority
              sizes="(min-width: 901px) 46vw, (max-width: 640px) 100vw, 88vw"
            />}
          </figure>
        ))}
        <div className={styles.photoScan} aria-hidden="true" />
      </div>

      <MobileHeroRibbons paused={paused} />

      <div className={styles.photoControls}>
        <div className={styles.photoDots} aria-label={heroCopy.photoDots}>
          {SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              data-active={index === activeIndex}
              aria-label={`写真 ${index + 1} を表示`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <span className={styles.photoMeta} aria-hidden="true">
          {String(activeIndex + 1).padStart(2, "0")}{heroCopy.photoMeta}{String(SLIDES.length).padStart(2, "0")}{heroCopy.photoMeta2}{activeIndex === 1 ? <>
            <span className={styles.desktopLocation}>{SLIDES[activeIndex].location}</span>
            <span className={styles.mobileLocation}>{heroMobileSecondSlide.location}</span>
          </> : SLIDES[activeIndex].location}
        </span>
        <button
          type="button"
          className={styles.pauseButton}
          aria-label={paused ? jaControls.resumePortraits : jaControls.pausePortraits}
          aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}
        >
          <span aria-hidden="true">{paused ? jaControls.portraitPlaySymbol : jaControls.portraitPauseSymbol}</span>
        </button>
      </div>
    </div>
  );
}
