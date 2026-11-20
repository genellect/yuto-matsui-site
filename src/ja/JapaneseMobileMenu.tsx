"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mobileMenuCopy, pageCopy } from "../content/ja";
import { FounderJapaneseLink } from "../shared/JapaneseLink";
import { site } from "../site";
import styles from "./founder.module.css";

type MenuLink = { label: string; href: string };

type JapaneseMobileMenuProps = {
  links: readonly MenuLink[];
  socials: ReactNode;
};

const MOBILE_QUERY = "(max-width: 900px)";

function LanguageSwitch({ className }: { className: string }) {
  return (
    <div className={className} role="group" aria-label={pageCopy.languageLabel}>
      <FounderJapaneseLink aria-current="page">{pageCopy.japaneseLanguage}</FounderJapaneseLink>
      <span aria-hidden="true">{pageCopy.languageSeparator}</span>
      <a href={site.englishPath}>{pageCopy.englishLanguage}</a>
    </div>
  );
}

/*
 * JP top page header for max-width 900px: wordmark (in page.tsx), language switch and a menu button.
 * The panel is portalled to the page root because the header's backdrop-filter would otherwise
 * become the containing block of a fixed descendant and clip the full-screen panel.
 */
export function JapaneseMobileMenu({ links, socials }: JapaneseMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalRoot(rootRef.current?.closest<HTMLElement>("[data-founder-page]") ?? document.body);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLAnchorElement>("nav a[href]")?.focus();

    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close(true);
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

    // Rotating or resizing past the breakpoint hides the panel; release the scroll lock with it.
    const mobile = window.matchMedia(MOBILE_QUERY);
    const onBreakpoint = () => {
      if (!mobile.matches) close(false);
    };

    document.addEventListener("keydown", onKeyDown);
    mobile.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mobile.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  const panel = (
    <div
      ref={panelRef}
      id="japanese-mobile-menu"
      className={styles.mobileMenuPanel}
      data-open={open}
      aria-hidden={!open}
    >
      <div className={styles.mobileMenuHeader}>
        <span>{pageCopy.wordmarkName}</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        >
          {mobileMenuCopy.closeText}
        </button>
      </div>
      <nav className={styles.mobileMenuLinks} aria-label={pageCopy.mobileNavigationLabel}>
        {links.map((link, index) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {link.label}
          </a>
        ))}
      </nav>
      <div className={styles.mobileMenuFooter}>
        <nav className={styles.mobileMenuSocials} aria-label={mobileMenuCopy.socials}>
          {socials}
        </nav>
        <LanguageSwitch className={styles.mobileLanguageSwitch} />
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className={styles.mobileHeaderActions}>
      <LanguageSwitch className={styles.mobileLanguageSwitch} />
      <button
        ref={triggerRef}
        type="button"
        className={styles.mobileMenuTrigger}
        aria-label={open ? mobileMenuCopy.close : mobileMenuCopy.open}
        aria-expanded={open}
        aria-controls="japanese-mobile-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span /><span />
      </button>
      {portalRoot ? createPortal(panel, portalRoot) : null}
    </div>
  );
}
