"use client";

import { fragmentCopy, fragmentSpreads, fragmentPhotos, mobileFragmentRows } from "../content/ja";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./founder.module.css";
import { FragmentFilm, FragmentFilmAtmosphere } from "../shared/fragment-film/FragmentFilm";
import { MobileFragmentFilm } from "../shared/fragment-film/MobileFragmentFilm";

const spreadDurationMs = 9_000;

function FragmentSignalField() {
  return (
    <svg
      className={styles.fragmentSignalField}
      data-fragment-ambient="signal-field"
      viewBox="0 0 1440 3600"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="fragment-signal-cool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#45a7bb" />
          <stop offset="0.52" stopColor="#477fae" />
          <stop offset="1" stopColor="#5f759f" />
        </linearGradient>
        <linearGradient id="fragment-signal-warm" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d0a76d" />
          <stop offset="0.58" stopColor="#97a68a" />
          <stop offset="1" stopColor="#54a0ae" />
        </linearGradient>
        <pattern id="fragment-field-grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M72 0H0V72" fill="none" stroke="#7392a7" strokeWidth="0.7" />
          <circle cx="0" cy="0" r="2.2" fill="#7392a7" />
        </pattern>
      </defs>

      <rect className={styles.fragmentFieldGrid} width="1440" height="3600" fill="url(#fragment-field-grid)" />
      <g className={styles.fragmentFieldDrift}>
        <path className={styles.fragmentFieldPath} d="M-90 310C250 110 460 620 770 390S1200 40 1530 300" />
        <path className={styles.fragmentFieldSignal} pathLength="100" d="M-90 310C250 110 460 620 770 390S1200 40 1530 300" />

        <path className={styles.fragmentFieldPath} d="M1540 950C1180 730 1010 1230 660 1060S150 760-100 1140" />
        <path className={styles.fragmentFieldSignalWarm} pathLength="100" d="M1540 950C1180 730 1010 1230 660 1060S150 760-100 1140" />

        <path className={styles.fragmentFieldPath} d="M-120 1730C250 1480 530 2070 850 1810S1210 1510 1540 1880" />
        <path className={styles.fragmentFieldSignal} pathLength="100" d="M-120 1730C250 1480 530 2070 850 1810S1210 1510 1540 1880" />

        <path className={styles.fragmentFieldPath} d="M1510 2660C1210 2380 990 2910 660 2710S200 2380-120 2800" />
        <path className={styles.fragmentFieldSignalWarm} pathLength="100" d="M1510 2660C1210 2380 990 2910 660 2710S200 2380-120 2800" />

        <g className={styles.fragmentFieldNodes}>
          <circle cx="180" cy="242" r="11" />
          <circle cx="768" cy="390" r="17" />
          <circle cx="1240" cy="176" r="9" />
          <circle cx="1186" cy="898" r="14" />
          <circle cx="658" cy="1060" r="20" />
          <circle cx="224" cy="1012" r="10" />
          <circle cx="298" cy="1660" r="13" />
          <circle cx="852" cy="1810" r="19" />
          <circle cx="1274" cy="1688" r="9" />
          <circle cx="1160" cy="2560" r="16" />
          <circle cx="660" cy="2710" r="21" />
          <circle cx="184" cy="2654" r="10" />
        </g>
      </g>
    </svg>
  );
}

function FragmentMobileReel({ currentPhoto }: { currentPhoto: string }) {
  const reel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(max-width: 700px)").matches) return;
    const photo = reel.current?.querySelector<HTMLElement>(`[data-reel-slot="${currentPhoto}"]`);
    const track = photo?.closest<HTMLElement>(`.${styles.fragmentReelTrack}`);
    if (!photo || !track) return;
    const loopWidth = track.scrollWidth / 2;
    const distance = photo.offsetLeft - Math.max(0, (reel.current!.clientWidth - photo.offsetWidth) / 2);
    const fraction = Math.max(0, distance / loopWidth);
    const reverse = track.dataset.reelRow === "2";
    track.style.animationDelay = `${-(reverse ? 1 - fraction : fraction) * (reverse ? 94 : 82)}s`;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) photo.parentElement?.parentElement?.parentElement?.scrollTo({left:photo.offsetLeft});
  }, [currentPhoto]);
  return (
    <div ref={reel} className={styles.fragmentMobileReel} aria-label={fragmentCopy.fragmentMobileReel}>
      {mobileFragmentRows.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.fragmentReelViewport}>
          <div className={styles.fragmentReelTrack} data-reel-row={rowIndex + 1}>
            {[false, true].map((duplicate) => (
              <div
                key={duplicate ? "duplicate" : "primary"}
                className={styles.fragmentReelGroup}
                aria-hidden={duplicate || undefined}
              >
                {row.map((photo) => (
                  <figure
                    key={`${photo.key}-${duplicate ? "duplicate" : "primary"}`}
                    className={styles.fragmentReelPhoto}
                    data-reel-slot={photo.key}
                    data-reel-role={photo.role}
                    data-tone={photo.tone}
                    style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                  >
                    <picture className={styles.fragmentReelPicture}>
                      <source
                        type="image/webp"
                        srcSet={photo.srcSet}
                        sizes="(max-width: 640px) 54vw, (max-width: 900px) 38vw, 1px"
                      />
                      <Image
                        className={styles.fragmentReelImage}
                        src={photo.src}
                        alt={duplicate ? "" : photo.alt}
                        width={photo.width}
                        height={photo.height}
                        sizes="(max-width: 640px) 54vw, (max-width: 900px) 38vw, 1px"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FounderFragments() {
  const [activeSpread, setActiveSpread] = useState(0);
  const [view, setView] = useState<"3d" | "original">("3d");
  const [wide, setWide] = useState(false);
  const [mobile, setMobile] = useState(false);
  const currentPhoto = useRef(fragmentPhotos[0].key);
  const section = useRef<HTMLElement>(null);
  const changeView = (next: "3d" | "original") => {
    if (mobile && view === "original" && next === "3d") {
      const pictures = section.current?.querySelectorAll<HTMLElement>("[data-reel-slot]");
      const center = window.innerWidth / 2;
      const nearest = Array.from(pictures ?? []).filter(p => { const r=p.getBoundingClientRect(); return r.right>0 && r.left<window.innerWidth; }).sort((a,b)=>Math.abs(a.getBoundingClientRect().left+a.offsetWidth/2-center)-Math.abs(b.getBoundingClientRect().left+b.offsetWidth/2-center))[0];
      if (nearest) currentPhoto.current = nearest.dataset.reelSlot!;
    }
    setView(next);
  };
  useEffect(() => {
    const media = matchMedia("(min-width: 901px) and (orientation: landscape)");
    const update = () => setWide(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const media = matchMedia("(max-width: 700px)");
    const update = () => setMobile(media.matches);
    update(); if (media.matches) setView("original"); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || ((wide || mobile) && view === "3d")) return;

    const timer = window.setTimeout(() => {
      setActiveSpread((current) => (current + 1) % fragmentSpreads.length);
    }, spreadDurationMs);

    return () => window.clearTimeout(timer);
  }, [activeSpread, wide, mobile, view]);

  return (
    <section ref={section} id="fragments" className={styles.fragments} aria-labelledby="fragments-title" data-fragment-view={view}>
      <FragmentSignalField />
      <FragmentFilmAtmosphere />
      <div className={styles.sectionShell}>
        <header className={styles.fragmentsHeader}>
          <h2 id="fragments-title">{fragmentCopy.fragmentsTitle}</h2>
          <div className={styles.fragmentViewSwitch} role="group" aria-label={fragmentCopy.presentationLabel}>
            <button type="button" aria-pressed={view === "3d"} aria-controls="fragment-film-view fragment-mobile-film-view" onClick={() => changeView("3d")}>{fragmentCopy.threeDimensionalView}</button>
            <button type="button" aria-pressed={view === "original"} aria-controls="fragment-original-view fragment-mobile-original-view" onClick={() => changeView("original")}>{fragmentCopy.originalView}</button>
          </div>
          <div className={styles.fragmentSequence} aria-label={fragmentCopy.fragmentSequence}>
            {fragmentSpreads.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`写真セット ${index + 1} を表示`}
                aria-pressed={activeSpread === index}
                onClick={() => setActiveSpread(index)}
              />
            ))}
          </div>
        </header>

        <div className={styles.fragmentFilmView} id="fragment-film-view">
          <FragmentFilm photos={fragmentPhotos} active={wide && view === "3d"} />
        </div>
        <div className={styles.mobileFilmView} id="fragment-mobile-film-view">
          {mobile && view === "3d" && <MobileFragmentFilm photos={fragmentPhotos} active currentPhoto={currentPhoto.current} onCurrentPhoto={key => { currentPhoto.current=key; }} onFailure={() => setView("original")} />}
        </div>
        <div className={styles.fragmentsEssay} id="fragment-original-view">
          {fragmentSpreads.map((spread, spreadIndex) => (
            <div
              key={spreadIndex}
              className={styles.fragmentSpread}
              data-spread={spreadIndex + 1}
              data-active={activeSpread === spreadIndex}
              aria-hidden={activeSpread !== spreadIndex}
            >
              {spread.map((photo) => (
                <figure
                  key={photo.key}
                  className={styles.fragmentPhoto}
                  data-slot={photo.key}
                  data-role={photo.role}
                  data-crop={photo.crop}
                  data-tone={photo.tone}
                >
                  <picture className={styles.fragmentPicture}>
                    <source type="image/webp" srcSet={photo.srcSet} sizes={photo.sizes} />
                    <Image
                      className={styles.fragmentImage}
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes={photo.sizes}
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </figure>
              ))}
            </div>
          ))}
        </div>

        <div id="fragment-mobile-original-view" className={styles.mobileOriginalView}>
          {(!mobile || view === "original") && <FragmentMobileReel currentPhoto={currentPhoto.current} />}
        </div>
      </div>
    </section>
  );
}
