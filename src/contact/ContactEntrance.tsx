"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./contact-entry.module.css";
import projection from "./contact-door-projection.json";
import { contactCopy as copy } from "./copy";

type Props = { onComplete: () => void };
const mediaRoot = "/images/contact-entry";

/** Blender-authored film; presentation only. Every path reaches the same form. */
export function ContactEntrance({ onComplete }: Props) {
  const [entering, setEntering] = useState(false);
  const [layout, setLayout] = useState<"desktop" | "mobile">("desktop");
  const [finishing, setFinishing] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (entering) return;
    const mobile = matchMedia("(max-width: 700px)");
    const sync = () => setLayout(mobile.matches ? "mobile" : "desktop");
    sync();
    mobile.addEventListener("change", sync);
    return () => mobile.removeEventListener("change", sync);
  }, [entering]);

  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    video.current?.pause();
    onComplete();
  };
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; });

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
    skip.current?.focus({ preventScroll: true });
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

  const enter = () => {
    if (entering || completed.current) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || saveData) { finish(); return; }
    // Freeze the framing through playback, including device rotation.
    setLayout(matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop");
    setEntering(true);
  };

  const area = projection[layout];
  return (
    <section className={styles.entrance} aria-labelledby={entering ? undefined : "entrance-title"} aria-label={entering ? copy.enteringLabel : undefined} data-contact-entrance>
      <div className={styles.heading}>
        <h2 id="entrance-title">{copy.entranceTitle}</h2>
      </div>
      <div className={styles.scene} data-entering={entering} data-film-layout={entering ? layout : undefined} data-finishing={finishing}>
        <picture className={styles.poster}>
          <source media="(max-width: 700px)" srcSet={`${mediaRoot}/lobby-mobile.webp`} />
          {/* The first rendered frame exactly matches the film. */}
          <img src={`${mediaRoot}/lobby-desktop.webp`} alt="" width="1280" height="720" fetchPriority="high" />
        </picture>
        {!entering ? (
          <div className={styles.doors}>
            <button className={styles.door} type="button" onClick={enter} data-door="study" aria-label={copy.doorLabel}
              style={{ left: `${area.left + area.width / 2}%`, top: `${area.top}%`, width: `max(44px, ${area.width}%)`, height: `${area.height}%` }} />
          </div>
        ) : <>
          <video ref={video} className={styles.film} src={`${mediaRoot}/entry-${layout}.mp4`} muted playsInline preload="auto" aria-hidden="true" onEnded={finish} onError={finish} onTimeUpdate={() => { if ((video.current?.currentTime ?? 0) >= 1.7) setFinishing(true); }} />
          <div className={styles.fade} />
        </>}
      </div>
      <div className={styles.controls}>
        {!entering ? <>
          <div className={styles.alternatives}>
            <button type="button" onClick={enter}>{copy.writeMessage} <span aria-hidden="true">↗</span></button>
          </div>
          <button className={styles.bypass} type="button" onClick={finish}>{copy.bypass} <span aria-hidden="true">→</span></button>
        </> : <>
          <p className={styles.status} role="status">{copy.entering}</p>
          <button ref={skip} type="button" className={styles.skip} onClick={finish}>{copy.skip} <span aria-hidden="true">→</span></button>
        </>}
      </div>
    </section>
  );
}
