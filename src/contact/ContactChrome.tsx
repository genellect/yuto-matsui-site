import styles from "./contact-chrome.module.css";

// The Contact page belongs to the portfolio: the header names whose inbox this is and
// leads home; the footer offers the two language editions of the portfolio.

export function ContactHeader() {
  return (
    <header className={styles.header} data-contact-header>
      <a className={styles.skip} href="#main">本文へスキップ</a>
      <div className={styles.headerInner}>
        <a className={styles.brandName} href="/">Yuto Matsui</a>
      </div>
    </header>
  );
}

export function ContactFooter() {
  return (
    <footer className={styles.footer} data-contact-footer>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <a className={styles.footerTitle} href="/">Yuto Matsui</a>
          <a className={styles.backTop} href="#contact-top">ページの先頭へ</a>
        </div>
        <nav className={styles.footerLinks} aria-label="ポートフォリオ">
          <a href="/">ポートフォリオ</a>
          <a href="/en/" lang="en">Portfolio in English</a>
        </nav>
        <p className={styles.copyright}>© {new Date().getFullYear()} Yuto Matsui. All rights reserved.</p>
      </div>
    </footer>
  );
}
