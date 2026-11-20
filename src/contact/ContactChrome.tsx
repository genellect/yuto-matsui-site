import { pageCopy } from "../content/ja";
import { JapaneseMobileMenu } from "../ja/JapaneseMobileMenu";
// The portfolio's own header and footer styles, used read-only so Contact matches the top page.
import founder from "../ja/founder.module.css";
import styles from "./contact-chrome.module.css";

// Contact is one page of the portfolio: it carries the top page's header and footer, with
// section links pointing back to the top page and Contact as the current page.

function ArrowIcon() {
  return <span aria-hidden="true">{pageCopy.externalArrow}</span>;
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle className={founder.iconFill} cx="17.4" cy="6.7" r="1.1" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path className={founder.iconFill} d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

// The top page's menu items, pointing back to the top page; Contact is the current page.
const mobileMenuLinks = [
  { label: pageCopy.navExpertise, href: "/#expertise" },
  { label: pageCopy.navStory, href: "/#story" },
  { label: pageCopy.navProducts, href: "/#products" },
  { label: pageCopy.navCredentials, href: "/#experience" },
  { label: pageCopy.navOffHours, href: "/#off-hours" },
  { label: pageCopy.navContact, href: "/contact/", current: true }
] as const;

export function ContactHeader() {
  return (
    <>
      <a className={`${founder.skipLink} ${styles.portfolio}`} href="#main">{pageCopy.skipLink}</a>
      <header className={`${founder.header} ${styles.portfolio}`} data-contact-header data-mobile-header>
        {/* Same structure as the top page: Mobile shows the role as its own line outside the link. */}
        <div className={founder.wordmarkGroup}>
          <a className={founder.wordmark} href="/" aria-label={pageCopy.wordmarkLabel}>
            <strong>{pageCopy.wordmarkName}</strong>
            <span>{pageCopy.wordmarkRole}</span>
          </a>
          <span className={founder.mobileWordmarkRole}>{pageCopy.wordmarkRole}</span>
        </div>
        <nav className={founder.navigation} aria-label={pageCopy.navigationLabel}>
          <a href="/#expertise">{pageCopy.navExpertise}</a>
          <a href="/#story">{pageCopy.navStory}</a>
          <a href="/#products">{pageCopy.navProducts}</a>
          <a href="/#experience">{pageCopy.navCredentials}</a>
          <a href="/#off-hours">{pageCopy.navOffHours}</a>
          <a href="/contact/" aria-current="page">{pageCopy.navContact}</a>
          <span className={founder.desktopLanguageSwitch} aria-label={pageCopy.languageLabel}>
            <a href="/contact/" aria-current="page">{pageCopy.japaneseLanguage}</a><span>{pageCopy.languageSeparator}</span><a href="/en/">{pageCopy.englishLanguage}</a>
          </span>
        </nav>
        <JapaneseMobileMenu
          links={mobileMenuLinks}
          japaneseHref="/contact/"
          panelClassName={styles.portfolio}
          socials={<>
            <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.mobileExternalIcons}><InstagramIcon /></a>
            <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.mobileExternalIcons2}><GitHubIcon /></a>
          </>}
        />
      </header>
    </>
  );
}

export function ContactFooter() {
  return (
    <footer className={`${founder.footer} ${styles.portfolio}`} data-contact-footer>
      <div className={founder.footerPrimary}>
        <div><strong>{pageCopy.footerName}</strong><span>{pageCopy.footerRole}</span></div>
        <nav aria-label={pageCopy.footerLinksLabel}>
          <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer">{pageCopy.footerInstagram}<ArrowIcon /></a>
          <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer">{pageCopy.footerGitHub}<ArrowIcon /></a>
          <a href="#contact-top">{pageCopy.backToTop}</a>
        </nav>
      </div>
      <div className={founder.footerLanguageSwitch} aria-label={pageCopy.footerLanguageSwitch}>
        <span>{pageCopy.footerLanguageSwitch2}</span>
        <div><a href="/contact/" aria-current="page">{pageCopy.footerLanguageSwitch3}</a><a href="/en/">{pageCopy.footerLanguageSwitch4}</a></div>
      </div>
      <p className={founder.copyright}>{pageCopy.copyright}</p>
    </footer>
  );
}
