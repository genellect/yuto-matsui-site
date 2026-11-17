"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./contact-entry.module.css";
import { contactCopy as copy } from "./copy";

type Props = { onComplete: () => void };
const mediaRoot = "/images/contact-entry";
const ENTRY_SEEN_KEY = "yuto-matsui:contact-entry-seen";

/**
 * Blender-authored film; presentation only. With a single destination there is
 * nothing to choose, so the entry plays as soon as the page opens. Reduced motion,
 * Save-Data, a hidden tab, a slow or failed film and Skip all reach the same form.
 */
export function ContactEntrance({ onComplete }: Props) {
  const [entering, setEntering] = useState(false);
  const [layout, setLayout] = useState<"desktop" | "mobile">("desktop");
  const [finishing, setFinishing] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const completed = useRef(false);

  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    try {
      sessionStorage.setItem(ENTRY_SEEN_KEY, "1");
    } catch {
      // Without storage the film plays again next time; nothing else depends on it.
    }
    video.current?.pause();
    onComplete();
  };
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; });

  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    // The film plays once per visit; returning within the same tab goes straight to the form.
    let seen = false;
    try {
      seen = sessionStorage.getItem(ENTRY_SEEN_KEY) === "1";
    } catch {
      // Storage may be unavailable (private mode, blocked site data); the film simply plays.
    }
    if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches || saveData || document.hidden) {
      finishRef.current();
      return;
    }
    // Freeze the framing through playback, including device rotation.
    setLayout(matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop");
    setEntering(true);
  }, []);

  useEffect(() => {
    if (!entering) return;
    const element = video.current;
    if (!element) return;
    let started = false;
    const loadDeadline = window.setTimeout(() => { if (!started) finishRef.current(); }, 800);
    const totalDeadline = window.setTimeout(() => finishRef.current(), 2700);
    const playing = () => { started = true; window.clearTimeout(loadDeadline); };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const onReduced = () => { if (reduced.matches) finishRef.current(); };
    const onHidden = () => { if (document.hidden) finishRef.current(); };
    element.addEventListener("playing", playing);
    reduced.addEventListener("change", onReduced);
    document.addEventListener("visibilitychange", onHidden);
    void element.play().catch(() => finishRef.current());
    return () => {
      window.clearTimeout(loadDeadline);
      window.clearTimeout(totalDeadline);
      element.removeEventListener("playing", playing);
      reduced.removeEventListener("change", onReduced);
      document.removeEventListener("visibilitychange", onHidden);
      element.pause();
    };
  }, [entering]);

  return (
    <section className={styles.entrance} aria-labelledby="entrance-title" data-contact-entrance>
      <div className={styles.heading}>
        <h2 id="entrance-title">{copy.entranceTitle}</h2>
      </div>
      <div className={styles.scene} data-entering={entering} data-film-layout={entering ? layout : undefined} data-finishing={finishing}>
        <picture className={styles.poster}>
          <source media="(max-width: 700px)" srcSet={`${mediaRoot}/lobby-mobile.webp`} />
          {/* The first rendered frame exactly matches the film. */}
          <img src={`${mediaRoot}/lobby-desktop.webp`} alt="" width="1280" height="720" fetchPriority="high" />
        </picture>
        {entering ? <>
          <video ref={video} className={styles.film} src={`${mediaRoot}/entry-${layout}.mp4`} muted playsInline preload="auto" aria-hidden="true" onEnded={finish} onError={finish} onTimeUpdate={() => { if ((video.current?.currentTime ?? 0) >= 1.7) setFinishing(true); }} />
          <div className={styles.fade} />
        </> : null}
      </div>
      <div className={styles.controls}>
        <p className={styles.status} role="status">{copy.entering}</p>
        <button type="button" className={styles.skip} onClick={finish}>{copy.skip} <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}
