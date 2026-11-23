import { site } from "../../../site";
import { pageCopy } from "../../../content/en";
import type { Metadata } from "next";
import Image from "next/image";
import { FounderJapaneseLink } from "../../../shared/JapaneseLink";
import { FounderProducts } from "../../../shared/products/FounderProducts";
import {
  compassOrigin,
  credentials,
  experience,
  expertise,
  founderOrigin,
  offHours,
  products
} from "../../../content/en";
import { EnglishFragments } from "../../../en/EnglishFragments";
import { EnglishHeroGallery } from "../../../en/EnglishHeroGallery";
import { EnglishHeroLight } from "../../../en/EnglishHeroLight";
import { EnglishPageLight } from "../../../en/EnglishPageLight";
import { EnglishSpotlight } from "../../../en/EnglishSpotlight";
import { EnglishMobileMenu } from "../../../en/EnglishMobileMenu";
import { GitHubIcon, InstagramIcon } from "../../../en/EnglishSocialIcons";
import { EnglishStatement } from "../../../en/EnglishStatement";
import { Phrases } from "../../../en/Phrases";
import { DepthCard, DepthVisual } from "../../../shared/portfolio/DepthCard";
import { OffHoursGallery } from "../../../shared/portfolio/OffHoursGallery";
import styles from "../../../en/english-founder.module.css";

const canonicalUrl = `${founderOrigin}/en/`;

export const metadata: Metadata = {
  title: "Yuto Matsui | Life Science Research & AI-Native Development",
  description:
    "The portfolio of Yuto Matsui, a systems engineer working at the intersection of molecular biology research and AI-native development.",
  authors: [{ name: "Yuto Matsui" }],
  alternates: {
    canonical: canonicalUrl,
    languages: {
      ja: `${founderOrigin}/`,
      en: canonicalUrl,
      "x-default": `${founderOrigin}/`
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" }
  },
  openGraph: {
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    type: "profile",
    siteName: "Yuto Matsui",
    title: "Yuto Matsui | Researcher & Engineer",
    description: "Life Science Research · AI-Native Engineering",
    url: canonicalUrl,
    images: [
      {
        url: `${founderOrigin}/images/founder-portfolio/yuto-matsui-profile-hero.webp`,
        width: 1600,
        height: 2400,
        alt: "Yuto Matsui"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuto Matsui | Researcher & Engineer",
    description: "Life Science Research · AI-Native Engineering",
    images: [`${founderOrigin}/images/founder-portfolio/yuto-matsui-profile-hero.webp`]
  }
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Yuto Matsui",
  alternateName: "松井優知",
  url: canonicalUrl,
  image: `${founderOrigin}/images/founder-portfolio/yuto-matsui-profile-hero.webp`,
  jobTitle: "Researcher & Engineer",
  knowsAbout: [
    "Life science research",
    "Molecular biology",
    "AI-native engineering"
  ],
  founder: {
    "@type": "Organization",
    name: "COMPASS",
    url: `${compassOrigin}/`
  },
  sameAs: ["https://github.com/genellect", "https://www.instagram.com/n.m.w.314/"]
};

function Arrow() {
  return <span aria-hidden="true">{pageCopy.externalArrow}</span>;
}

export default function EnglishFounderPage() {
  return (
    <div className={styles.page} data-english-founder-page>
      <a className={styles.skipLink} href="#main">{pageCopy.skipLink}</a>
      <EnglishPageLight />

      <header className={styles.siteHeader}>
        <a className={styles.wordmark} href="#top" aria-label={pageCopy.wordmarkLabel}>
          <strong>{pageCopy.wordmarkName}</strong>
          <span>{pageCopy.wordmarkRole}</span>
        </a>
        <nav className={styles.desktopNav} aria-label={pageCopy.navigationLabel}>
          <a href="#expertise">{pageCopy.navExpertise}</a>
          <a href="#fragments">{pageCopy.navFragments}</a>
          <a href="#statement">{pageCopy.navStatement}</a>
          <a href="#work">{pageCopy.navWork}</a>
          <a href="#experience">{pageCopy.navExperience}</a>
          <a href="#contact">{pageCopy.navContact}</a>
          <span className={styles.languageSwitch} aria-label={pageCopy.languageSwitch}>
            <FounderJapaneseLink>{pageCopy.languageSwitch2}</FounderJapaneseLink><span>{pageCopy.languageSwitch3}</span><a href={site.englishPath} aria-current="page">{pageCopy.languageSwitch4}</a>
          </span>
        </nav>
        <EnglishMobileMenu />
      </header>

      <main id="main">
        <section id="top" className={styles.hero} aria-labelledby="english-founder-title" data-hero-interface data-hero-cycle="0">
          <EnglishHeroLight />
          <div className={styles.heroCopy}>
            <p className={styles.heroRole}><span>{pageCopy.heroRole}</span>{pageCopy.heroRole2}<span>{pageCopy.heroRole3}</span></p>
            <h1 id="english-founder-title">{pageCopy.englishFounderTitle}</h1>
            <p className={styles.heroThesis}>{pageCopy.heroThesis}<br />{pageCopy.heroThesis2}</p>
            <p className={styles.heroDomains}><span>{pageCopy.heroDomains}</span>{pageCopy.heroDomains2}<span>{pageCopy.heroDomains3}</span></p>
            <nav className={styles.heroSocialLinks} aria-label={pageCopy.heroSocialLinks}>
              <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.heroSocialLinks2} title={pageCopy.heroSocialLinks2}>
                <InstagramIcon />
              </a>
              <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.heroSocialLinks3} title={pageCopy.heroSocialLinks3}>
                <GitHubIcon />
              </a>
            </nav>
          </div>
          <EnglishHeroGallery />
        </section>

        <section id="expertise" className={styles.expertise} aria-labelledby="expertise-title">
          <div className={styles.sectionShell}>
            <header className={styles.sectionHeading}>
              <p className={styles.sectionIndex}>{pageCopy.expertiseIndex}</p>
              <h2 id="expertise-title">{pageCopy.expertiseTitle}</h2>
            </header>
            <div className={styles.expertiseGrid}>
              {expertise.map((item, index) => (
                <DepthCard key={item.number} depth="expertise" editorial className={styles.expertisePlate} data-accent={item.accent} data-order={index + 1} data-spotlight>
                  <DepthVisual className={styles.expertiseImage} data-depth-layer="image">
                    <Image decoding="sync" loading="eager" src={item.image} alt={item.alt} fill sizes="(min-width: 1100px) 438px, (min-width: 901px) 43vw, (min-width: 641px) 552px, 86vw" />
                    <div className={styles.expertiseNumber} data-depth-layer="detail">{item.number}</div>
                  </DepthVisual>
                  <div className={styles.expertiseCopy} data-depth-layer="copy">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </DepthCard>
              ))}
            </div>
          </div>
        </section>

        <EnglishFragments />

        <section id="statement" className={styles.statement} aria-labelledby="statement-title">
          <div className={styles.statementShell}>
            <aside className={styles.statementIdentity}>
              <p className={styles.sectionIndex}>{pageCopy.statementIndex}</p>
              <h2 id="statement-title"><Phrases text={pageCopy.statementTitle} phrases={["Between", "Life Science", "and Engineering"]} /></h2>
              <div className={styles.statementPortrait} data-tilt-frame>
                <Image
                  src="/images/founder-portfolio/yuto-matsui-front.webp"
                  alt={pageCopy.statementPortrait}
                  fill
                  sizes="(min-width: 901px) 35vw, 92vw"
                />
              </div>
            </aside>
            <EnglishStatement />
          </div>
        </section>

        <section id="work" className={styles.work} aria-labelledby="work-title">
          <div className={styles.sectionShell}>
            <header className={styles.workHeading}>
              <div><p className={styles.sectionIndex}>{pageCopy.workIndex}</p><h2 id="work-title">{pageCopy.workTitle}</h2></div>
            </header>

            <FounderProducts products={products} language="en" />
          </div>
        </section>

        <section id="experience" className={styles.evidence} aria-labelledby="experience-title">
          <div className={styles.sectionShell}>
            <header className={styles.evidenceHeading}>
              <div><p className={styles.sectionIndex}>{pageCopy.experienceIndex}</p><h2 id="experience-title">{pageCopy.experienceTitle}</h2></div>
              <p>{pageCopy.evidenceHeading}</p>
            </header>
            <div className={styles.experienceGrid}>
              {experience.map((item) => (
                <DepthCard key={item.area} depth="experience" editorial className={styles.experienceItem}>
                  {item.area === "Development" ? <a className={styles.experienceLink} href="https://github.com/genellect" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.experienceLink} /> : null}
                  <DepthVisual className={styles.experienceImage} data-depth-layer="image">
                    <Image decoding="sync" loading="eager" src={item.image} alt={item.alt} fill sizes="(min-width: 901px) 31vw, 92vw" />
                  </DepthVisual>
                  <div className={styles.experienceMeta} data-depth-layer="copy"><span>{item.area}</span><strong>{item.years}</strong></div>
                  <p>{item.focus.map((focus) => <span key={focus}>{focus}</span>)}</p>
                </DepthCard>
              ))}
            </div>
            <div className={styles.credentialsGrid} aria-label={pageCopy.credentialsGrid} data-spotlight>
              {credentials.map((credential) => (
                <article key={credential.name} className={styles.credentialItem}>
                  <span>{credential.mark}</span>
                  <div><p>{credential.name}</p><strong>{credential.score}</strong><small>{credential.cefr}</small></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="off-hours" className={styles.offHours} aria-labelledby="off-hours-title">
          <div className={styles.sectionShell}>
            <header className={styles.offHoursHeading}>
              <p className={styles.sectionIndex}>{pageCopy.offHoursIndex}</p>
              <h2 id="off-hours-title">{pageCopy.offHoursTitle}</h2>
            </header>
            <OffHoursGallery language="en"
              photos={offHours.map(item => ({ ...item, copy: [item.copy] }))}
              classes={{ grid: styles.offHoursGrid, card: styles.offHoursCard, visual: styles.offHoursImage }} />
          </div>
        </section>

        <section id="contact" className={styles.contact} aria-labelledby="contact-title">
          <div className={styles.contactField} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.contactShell}>
            <div>
              <p className={styles.sectionIndex}>{pageCopy.contactIndex}</p>
              <h2 id="contact-title">{pageCopy.contactTitle}</h2>
            </div>
            <div className={styles.contactCopy}>
              <div className={styles.contactIntroduction}>
                <p>{pageCopy.contactIntroduction}</p>
                <p>{pageCopy.contactIntroduction2}</p>
                <p>{pageCopy.contactIntroduction3}</p>
              </div>
              <div className={styles.contactEmail} aria-label={pageCopy.emailDetailsLabel} data-spotlight>
                <p><strong>{pageCopy.contactName}</strong><span>{pageCopy.contactRole}</span></p>
                <p><span>{pageCopy.personalEmailLabel}</span><span>{pageCopy.personalEmail}</span></p>
                <p><span>{pageCopy.universityEmailLabel}</span><span>{pageCopy.universityEmail}</span></p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerPrimary}>
          <div><strong>{pageCopy.footerName}</strong><span>{pageCopy.footerRole}</span></div>
          <nav aria-label={pageCopy.footerLinksLabel}>
            <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer">{pageCopy.footerInstagram}<Arrow /></a>
            <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer">{pageCopy.footerGitHub}<Arrow /></a>
            <a href="#top">{pageCopy.backToTop}</a>
          </nav>
        </div>
        <div className={styles.footerLanguageSwitch} aria-label={pageCopy.footerLanguageSwitch}>
          <span>{pageCopy.footerLanguageSwitch}</span>
          <div><FounderJapaneseLink>{pageCopy.footerLanguageSwitch2}</FounderJapaneseLink><a href={site.englishPath} aria-current="page">{pageCopy.footerLanguageSwitch3}</a></div>
        </div>
        <details className={styles.credits}>
          <summary>{pageCopy.credits}</summary>
          <p>{pageCopy.creditsLifeScience}<a href="https://unsplash.com/photos/white-and-black-microscope-5HbxyB0_DBg" target="_blank" rel="noopener noreferrer">{pageCopy.creditJaronNix}</a>{pageCopy.creditsSoftware}<a href="https://unsplash.com/photos/code-appears-on-a-computer-screen-XG5q_aosoPo" target="_blank" rel="noopener noreferrer">{pageCopy.creditRobWingate}</a>{pageCopy.creditsPersonalAndDevelopment}<a href="https://www.pexels.com/photo/monitor-displaying-lines-of-code-6424583/" target="_blank" rel="noopener noreferrer">{pageCopy.creditNemuelSereti}</a>{pageCopy.creditsEducation}<a href="https://unsplash.com/photos/empty-lecture-hall-with-tiered-seating-and-projector-screen-L5GTAFIeKNA" target="_blank" rel="noopener noreferrer">{pageCopy.creditFabioSasso}</a>{pageCopy.creditsManifestoAndDrive}<a href="https://unsplash.com/photos/a-car-drives-along-a-scenic-mountain-road-e6XJTEz5SfA" target="_blank" rel="noopener noreferrer">{pageCopy.creditZixplore}</a>{pageCopy.creditsShogi}<a href="https://commons.wikimedia.org/wiki/File:Hulic_Shogi-kaikan_Sendagaya_Building_entrance_2024-09-12.jpg" target="_blank" rel="noopener noreferrer">{pageCopy.creditAsanagi}</a>{pageCopy.creditsDna}<a href="https://unsplash.com/photos/gray-laboratory-machine-to8o0bqOA6Q" target="_blank" rel="noopener noreferrer">{pageCopy.creditNci}</a>{pageCopy.creditsMicroscopy}<a href="https://unsplash.com/photos/white-and-black-microscope-on-white-surface-JdtUKqGdqw8" target="_blank" rel="noopener noreferrer">{pageCopy.creditPawel}</a>{pageCopy.creditsPipetting}<a href="https://unsplash.com/photos/person-using-pipette-in-laboratory-wDxFn_dBEC0" target="_blank" rel="noopener noreferrer">{pageCopy.creditCdc}</a>{pageCopy.creditsTerminal}<a href="https://unsplash.com/photos/computer-screen-displaying-code-and-terminal-prompts-N4pwMINNNL8" target="_blank" rel="noopener noreferrer">{pageCopy.creditBernd}</a>{pageCopy.creditsAnalysis}<a href="https://unsplash.com/photos/laptop-screen-displaying-code-and-data-charts-GQOylIn892U" target="_blank" rel="noopener noreferrer">{pageCopy.creditDaniil}</a>{pageCopy.creditsServers}<a href="https://unsplash.com/photos/a-rack-of-servers-in-a-server-room-2JJ3wBHu4_0" target="_blank" rel="noopener noreferrer">{pageCopy.creditKevin}</a>{pageCopy.creditsMicrofluidics}<a href="https://www.oist.jp/image/photograph-microfluidic-devices-microbionanofluidics-unit" target="_blank" rel="noopener noreferrer">{pageCopy.creditOist}</a>{pageCopy.creditsWafer}<a href="https://www.oist.jp/image/silicon-wafer-deposition-chamber-oist-engineering-section" target="_blank" rel="noopener noreferrer">{pageCopy.creditOist}</a>{pageCopy.creditsPersonal}</p>
        </details>
        <p className={styles.copyright}>{pageCopy.copyright}</p>
      </footer>

      <EnglishSpotlight />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
    </div>
  );
}
