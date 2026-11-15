"use client";

import { site } from "../site";

import { controls as enControls, menuCopy, mobileLinks as links } from "../content/en";
import { useEffect, useRef, useState } from "react";
import { FounderJapaneseLink } from "../shared/JapaneseLink";
import { GitHubIcon, InstagramIcon } from "./EnglishSocialIcons";
import styles from "./english-founder.module.css";

const englishPortfolioUrl = site.englishPath;

export function EnglishMobileMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstLink = panelRef.current?.querySelector<HTMLAnchorElement>("a[href]");
    firstLink?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.mobileMenuRoot}>
      <span className={styles.mobileHeaderLanguage} aria-label={menuCopy.mobileHeaderLanguage}>
        <FounderJapaneseLink>{menuCopy.mobileHeaderLanguage2}</FounderJapaneseLink>
        <span>{menuCopy.mobileHeaderLanguage3}</span>
        <a href={englishPortfolioUrl} aria-current="page">{menuCopy.mobileHeaderLanguage4}</a>
      </span>
      <button
        ref={triggerRef}
        type="button"
        className={styles.mobileMenuTrigger}
        aria-label={open ? enControls.closeMenu : enControls.openMenu}
        aria-expanded={open}
        aria-controls="english-mobile-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span /><span />
      </button>

      <div
        ref={panelRef}
        id="english-mobile-menu"
        className={styles.mobileMenuPanel}
        data-open={open}
        aria-hidden={!open}
      >
        <div className={styles.mobileMenuHeader}>
          <span>{menuCopy.mobileMenuHeader}</span>
          <button type="button" onClick={() => setOpen(false)} aria-label={menuCopy.mobileMenuHeader2}>{menuCopy.mobileMenuHeader3}</button>
        </div>
        <nav className={styles.mobileMenuLinks} aria-label={menuCopy.mobileMenuLinks}>
          {links.map((link, index) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{link.label}
            </a>
          ))}
        </nav>
        <div className={styles.mobileMenuFooter}>
          <nav className={styles.mobileMenuSocials} aria-label={menuCopy.mobileMenuSocials}>
            <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer" aria-label={menuCopy.mobileMenuSocials2}><InstagramIcon /></a>
            <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer" aria-label={menuCopy.mobileMenuSocials3}><GitHubIcon /></a>
          </nav>
          <div className={styles.mobileMenuLanguage}>
            <span>{menuCopy.mobileMenuLanguage}</span>
            <div><FounderJapaneseLink>{menuCopy.mobileMenuLanguage2}</FounderJapaneseLink><span>{menuCopy.mobileMenuLanguage3}</span><a href={englishPortfolioUrl} aria-current="page">{menuCopy.mobileMenuLanguage4}</a></div>
          </div>
        </div>
      </div>
    </div>
  );
}
