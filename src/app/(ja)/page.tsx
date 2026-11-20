import { pageCopy, japaneseMetadata, fields, products, credentials, experience, offHours, personSchema } from "../../content/ja";
import { FOUNDER_URL, site, COMPASS_ORIGIN } from "../../site";
import type { Metadata } from "next";
import Image from "next/image";
import { LegacyInteractions } from "../../inherited/interactions/LegacyInteractions";
import { FounderJapaneseLink } from "../../shared/JapaneseLink";
import { FounderProducts } from "../../shared/products/FounderProducts";
import { EssayContinuation } from "../../ja/EssayContinuation";
import { FounderFragments } from "../../ja/FounderFragments";
import { FounderHeroGallery } from "../../ja/FounderHeroGallery";
import { JapaneseMobileMenu } from "../../ja/JapaneseMobileMenu";
import { DepthCard, DepthVisual } from "../../shared/portfolio/DepthCard";
import { OffHoursGallery } from "../../shared/portfolio/OffHoursGallery";
import styles from "../../ja/founder.module.css";

export const metadata: Metadata = japaneseMetadata;

// Same destinations and labels as the Desktop navigation.
const mobileMenuLinks = [
  { label: pageCopy.navExpertise, href: "#expertise" },
  { label: pageCopy.navStory, href: "#story" },
  { label: pageCopy.navProducts, href: "#products" },
  { label: pageCopy.navCredentials, href: "#experience" },
  { label: pageCopy.navOffHours, href: "#off-hours" },
  { label: pageCopy.navContact, href: "#contact-cta" }
] as const;

function ArrowIcon() {
  return <span aria-hidden="true">{pageCopy.externalArrow}</span>;
}

function opensInNewTab(href: string) {
  try {
    return new URL(href, COMPASS_ORIGIN).origin !== COMPASS_ORIGIN;
  } catch {
    return false;
  }
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle className={styles.iconFill} cx="17.4" cy="6.7" r="1.1" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path className={styles.iconFill} d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export default function FounderPage() {
  return (
    <div className={styles.page} data-founder-page>
      <a className={styles.skipLink} href="#founder-main">{pageCopy.skipLink}</a>

      <header className={styles.header} data-mobile-header>
        {/* Mobile shows the role as its own line outside the link, so the link's name still matches its visible text. */}
        <div className={styles.wordmarkGroup}>
          <a className={styles.wordmark} href="#top" aria-label={pageCopy.wordmarkLabel}>
            <strong>{pageCopy.wordmarkName}</strong>
            <span>{pageCopy.wordmarkRole}</span>
          </a>
          <span className={styles.mobileWordmarkRole}>{pageCopy.wordmarkRole}</span>
        </div>
        <nav className={styles.navigation} aria-label={pageCopy.navigationLabel}>
          <a href="#expertise">{pageCopy.navExpertise}</a>
          <a href="#story">{pageCopy.navStory}</a>
          <a href="#products">{pageCopy.navProducts}</a>
          <a href="#experience">{pageCopy.navCredentials}</a>
          <a href="#off-hours">{pageCopy.navOffHours}</a>
          <a href="#contact-cta">{pageCopy.navContact}</a>
          <span className={styles.desktopLanguageSwitch} aria-label={pageCopy.languageLabel}>
            <FounderJapaneseLink aria-current="page">{pageCopy.japaneseLanguage}</FounderJapaneseLink><span>{pageCopy.languageSeparator}</span><a href={site.englishPath}>{pageCopy.englishLanguage}</a>
          </span>
        </nav>
        <JapaneseMobileMenu
          links={mobileMenuLinks}
          socials={<>
            <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.mobileExternalIcons}><InstagramIcon /></a>
            <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.mobileExternalIcons2}><GitHubIcon /></a>
          </>}
        />
      </header>

      <main id="founder-main">
        <section id="top" className={styles.hero} aria-labelledby="founder-title">
          <div className={styles.heroAmbient} aria-hidden="true"><span /><span /><span /></div>
          <FounderHeroGallery />

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{pageCopy.eyebrow}</p>
            <h1 id="founder-title">{pageCopy.founderTitle}</h1>
            <p className={styles.japaneseName}>{pageCopy.japaneseName}</p>
            <p className={styles.heroStatement}><span>{pageCopy.heroStatement}</span><span>{pageCopy.heroStatement2}</span></p>

            <ul className={styles.axisList} aria-label={pageCopy.axisList}>
              <li data-accent="bio"><span aria-hidden="true" />{pageCopy.axisList2}</li>
              <li data-accent="ai"><span aria-hidden="true" />{pageCopy.axisList3}</li>
            </ul>

            <nav className={styles.socialLinks} aria-label={pageCopy.socialLinks}>
              <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.socialLinks2} title={pageCopy.socialLinks2}>
                <InstagramIcon />
              </a>
              <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.socialLinks3} title={pageCopy.socialLinks3}>
                <GitHubIcon />
              </a>
            </nav>
          </div>

          <div className={styles.interfaceGraphic} aria-hidden="true">
            <svg viewBox="0 0 410 220" role="presentation">
              <path className={styles.bioLine} d="M8 34 C124 34 135 110 250 110" />
              <path className={styles.aiLine} d="M8 110 H250" />
              <path className={styles.educationLine} d="M8 186 C124 186 135 110 250 110" />
              <circle className={styles.bioNode} cx="8" cy="34" r="4" />
              <circle className={styles.aiNode} cx="8" cy="110" r="4" />
              <circle className={styles.educationNode} cx="8" cy="186" r="4" />
              <circle className={styles.interfaceNode} cx="250" cy="110" r="7" />
              <path className={styles.outputLine} d="M258 110 H402" />
            </svg>
          </div>
        </section>

        <section id="expertise" className={styles.expertise} aria-labelledby="expertise-title">
          <div className={styles.sectionShell}>
            <header className={styles.compactHeading} data-reveal>
              <h2 id="expertise-title">{pageCopy.expertiseTitle}</h2>
            </header>
            <div className={styles.fieldGrid}>
              {fields.map((field) => (
                <DepthCard key={field.id} depth="expertise" className={styles.fieldCard} data-accent={field.accent}>
                  <DepthVisual className={styles.fieldImage} data-depth-layer="image">
                    <Image decoding="sync" loading="eager" src={field.image} alt={field.alt} fill sizes="(min-width: 1100px) 438px, (min-width: 901px) 43vw, (min-width: 641px) 552px, 86vw" />
                    <div className={styles.fieldOverlay} aria-hidden="true" />
                    <span className={styles.fieldNumber}>{field.id}</span>
                  </DepthVisual>
                  <div className={styles.fieldCopy} data-depth-layer="copy">
                    <p>{field.english}</p>
                    <h3>{field.title}</h3>
                    <span>{field.description}</span>
                  </div>
                </DepthCard>
              ))}
            </div>
          </div>
        </section>

        <FounderFragments />

        <section id="story" className={styles.story} aria-labelledby="story-title">
          <div className={styles.storyShell}>
            <aside className={styles.storyPortrait} data-reveal>
              <div className={styles.storyPortraitFrame}>
                <Image src="/images/founder-portfolio/yuto-matsui-front.webp" alt={pageCopy.storyPortraitFrame} fill sizes="(min-width: 901px) 38vw, 92vw" />
                <div className={styles.storyPhotoGrid} aria-hidden="true" />
              </div>
              <div className={styles.storyPortraitCaption}>
                <span>{pageCopy.storyPortraitCaption}</span>
                <strong>{pageCopy.storyPortraitCaption2}</strong>
              </div>
            </aside>

            <div className={styles.essay}>
              <header id="message" className={styles.storyHeading} data-reveal>
                <p className={styles.sectionKicker}>{pageCopy.statementKicker}</p>
                <h2 id="story-title">{pageCopy.storyTitle}<span className={styles.mobileStoryBreak} aria-hidden="true"><br /></span>{pageCopy.storyTitle2}<br />{pageCopy.storyTitle3}</h2>
              </header>

              <section className={styles.essayChapter} aria-labelledby="chapter-origin" data-reveal>
                <header><span>{pageCopy.originNumber}</span><h3 id="chapter-origin">{pageCopy.chapterOrigin}</h3></header>
                <p>{pageCopy.originProgramming}</p>
                <p>{pageCopy.originResearch}</p>
                <p>{pageCopy.originAi}</p>
              </section>

              <EssayContinuation
                className={styles.essayContinuation}
                buttonClassName={styles.essayContinuationButton}
                contentClassName={styles.essayContinuationContent}
              >
                <section className={styles.essayChapter} aria-labelledby="chapter-work">
                  <header><span>{pageCopy.workNumber}</span><h3 id="chapter-work">{pageCopy.chapterWork}</h3></header>
                  <p>{pageCopy.workTransition}</p>
                  <p>{pageCopy.workResponsibility}</p>
                </section>

                <section className={styles.essayChapter} aria-labelledby="chapter-interface">
                  <header><span>{pageCopy.interfaceNumber}</span><h3 id="chapter-interface">{pageCopy.chapterInterface}</h3></header>
                  <p>{pageCopy.interfaceMission}</p>
                </section>

                <section className={`${styles.essayChapter} ${styles.essayClosing}`} aria-labelledby="chapter-future">
                  <header><span>{pageCopy.futureNumber}</span><h3 id="chapter-future">{pageCopy.futureTitle}</h3></header>
                  <p>{pageCopy.futureBarriers}</p>
                  <p>{pageCopy.futureAmbition}</p>
                  <p className={styles.closingInvitation}>{pageCopy.closingInvitation}</p>
                </section>
              </EssayContinuation>
            </div>
          </div>
        </section>

        <section id="products" className={styles.products} aria-labelledby="products-title">
          <div className={styles.sectionShell}>
            <header className={styles.productsHeading} data-reveal>
              <div><p className={styles.sectionKicker}>{pageCopy.productsKicker}</p><h2 id="products-title">{pageCopy.productsTitle}</h2></div>
            </header>
            <FounderProducts products={products} />
          </div>
        </section>

        <section id="experience" className={styles.experience} aria-labelledby="experience-title">
          <div className={styles.sectionShell}>
            <header className={styles.compactHeading} data-reveal>
              <p className={styles.sectionKicker}>{pageCopy.experienceKicker}</p>
              <div className={styles.experienceHeading}>
                <h2 id="experience-title">{pageCopy.experienceTitle}</h2>
                <p>{pageCopy.experienceHeading}</p>
              </div>
            </header>
            <div className={styles.experienceGrid}>
              {experience.map((item) => (
                <DepthCard key={item.area} depth="experience" className={styles.experienceCard} data-accent={item.accent}>
                  {item.area === "Development" ? <a className={styles.experienceLink} href="https://github.com/genellect" target="_blank" rel="noopener noreferrer" aria-label={pageCopy.experienceLink} /> : null}
                  <DepthVisual className={styles.experienceVisual} data-depth-layer="image">
                    <Image decoding="sync" loading="eager" src={item.image} alt={item.alt} fill sizes="(min-width: 901px) 31vw, (min-width: 641px) 31vw, 100vw" />
                  </DepthVisual>
                  <div className={styles.experienceBody}>
                    <div className={styles.experienceMeta}>
                      <div className={styles.experienceArea}>
                        <span className={styles.experienceLabel}>{pageCopy.areaLabel}</span>
                        <h3>{item.area}</h3>
                      </div>
                      <div className={styles.experienceTenure}>
                        <span className={styles.experienceLabel}>{pageCopy.tenureLabel}</span>
                        <strong>{item.years}</strong>
                      </div>
                    </div>
                    <div className={styles.experienceFocus} data-depth-layer="detail">
                      <span className={styles.experienceLabel}>{pageCopy.focusLabel}</span>
                      <p>{item.focus.map((line) => <span key={line}>{line}</span>)}</p>
                    </div>
                  </div>
                </DepthCard>
              ))}
            </div>
          </div>
        </section>

        <section id="credentials" className={styles.credentials} aria-labelledby="credentials-title">
          <div className={styles.sectionShell}>
            <header className={styles.compactHeading} data-reveal>
              <p className={styles.sectionKicker}>{pageCopy.credentialsKicker}</p>
              <h2 id="credentials-title">{pageCopy.credentialsTitle}</h2>
            </header>
            <div className={styles.credentialGrid}>
              {credentials.map((credential) => (
                <article key={credential.name} className={styles.credentialCard} data-credential={credential.kind} data-reveal>
                  <span className={styles.credentialMark} aria-hidden="true">{credential.mark}</span>
                  <div><p>{credential.name}</p><strong>{credential.score}</strong></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="off-hours" className={styles.offHours} aria-labelledby="off-hours-title">
          <div className={styles.sectionShell}>
            <header className={styles.offHoursHeading} data-reveal>
              <p className={styles.sectionKicker}>{pageCopy.offHoursKicker}</p>
              <h2 id="off-hours-title">{pageCopy.offHoursTitle}</h2>
            </header>
            <OffHoursGallery language="ja"
              photos={offHours.map(item => ({ ...item, number: item.id }))}
              classes={{ grid: styles.offHoursGrid, card: styles.offHoursCard, visual: styles.offHoursVisual, copy: styles.offHoursCopy }} />
          </div>
        </section>

        <section id="contact-cta" className={styles.contact} aria-labelledby="contact-title">
          <div className={styles.contactShell} data-reveal>
            <div>
              <p className={styles.contactKicker}>{pageCopy.contactKicker}</p>
              <h2 id="contact-title">{pageCopy.contactTitle}</h2>
            </div>
            <div className={styles.contactCopy}>
              <p>{pageCopy.contactCopy}</p>
              <a href="/contact/">{pageCopy.contactFormLink}<span aria-hidden="true">{pageCopy.contactFormArrow}</span></a>
              <details className={styles.contactEmail}>
                <summary>{pageCopy.contactEmail}</summary>
                <div className={styles.contactEmailPanel}>
                  <p className={styles.contactEmailIdentity}>
                    <strong>{pageCopy.contactEmailIdentity}</strong>
                    <span>{pageCopy.contactEmailIdentity2}</span>
                  </p>
                  <div className={styles.contactEmailAddresses}>
                    <p><span>{pageCopy.personalEmailLabel}</span><a className={styles.contactEmailValue} href={`mailto:${pageCopy.personalEmail}`}>{pageCopy.personalEmail}</a></p>
                    <p><span>{pageCopy.universityEmailLabel}</span><a className={styles.contactEmailValue} href={`mailto:${pageCopy.universityEmail}`}>{pageCopy.universityEmail}</a></p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerPrimary}>
          <div><strong>{pageCopy.footerName}</strong><span>{pageCopy.footerRole}</span></div>
          <nav aria-label={pageCopy.footerLinksLabel}>
            <a href="https://www.instagram.com/n.m.w.314/?__pwa=1#" target="_blank" rel="noopener noreferrer">{pageCopy.footerInstagram}<ArrowIcon /></a>
            <a href="https://github.com/genellect" target="_blank" rel="noopener noreferrer">{pageCopy.footerGitHub}<ArrowIcon /></a>
            <a href="#top">{pageCopy.backToTop}</a>
          </nav>
        </div>
        <div className={styles.footerLanguageSwitch} aria-label={pageCopy.footerLanguageSwitch}>
          <span>{pageCopy.footerLanguageSwitch2}</span>
          <div><FounderJapaneseLink aria-current="page">{pageCopy.footerLanguageSwitch3}</FounderJapaneseLink><a href={site.englishPath}>{pageCopy.footerLanguageSwitch4}</a></div>
        </div>
        <details className={styles.credits}>
          <summary>{pageCopy.credits}</summary>
          <p>{pageCopy.creditsLifeScience}<a href="https://unsplash.com/photos/white-and-black-microscope-5HbxyB0_DBg" target="_blank" rel="noopener noreferrer">{pageCopy.creditJaronNix}</a>{pageCopy.creditsSoftware}<a href="https://unsplash.com/photos/code-appears-on-a-computer-screen-XG5q_aosoPo" target="_blank" rel="noopener noreferrer">{pageCopy.creditRobWingate}</a>{pageCopy.creditsPersonalAndDevelopment}<a href="https://www.pexels.com/photo/monitor-displaying-lines-of-code-6424583/" target="_blank" rel="noopener noreferrer">{pageCopy.creditNemuelSereti}</a>{pageCopy.creditsEducation}<a href="https://unsplash.com/photos/empty-lecture-hall-with-tiered-seating-and-projector-screen-L5GTAFIeKNA" target="_blank" rel="noopener noreferrer">{pageCopy.creditFabioSasso}</a>{pageCopy.creditsManifestoAndDrive}<a href="https://unsplash.com/photos/a-car-drives-along-a-scenic-mountain-road-e6XJTEz5SfA" target="_blank" rel="noopener noreferrer">{pageCopy.creditZixplore}</a>{pageCopy.creditsShogi}<a href="https://commons.wikimedia.org/wiki/File:Hulic_Shogi-kaikan_Sendagaya_Building_entrance_2024-09-12.jpg" target="_blank" rel="noopener noreferrer">{pageCopy.creditAsanagi}</a>{pageCopy.creditsDna}<a href="https://unsplash.com/photos/gray-laboratory-machine-to8o0bqOA6Q" target="_blank" rel="noopener noreferrer">{pageCopy.creditNci}</a>{pageCopy.creditsMicroscopy}<a href="https://unsplash.com/photos/white-and-black-microscope-on-white-surface-JdtUKqGdqw8" target="_blank" rel="noopener noreferrer">{pageCopy.creditPawel}</a>{pageCopy.creditsPipetting}<a href="https://unsplash.com/photos/person-using-pipette-in-laboratory-wDxFn_dBEC0" target="_blank" rel="noopener noreferrer">{pageCopy.creditCdc}</a>{pageCopy.creditsTerminal}<a href="https://unsplash.com/photos/computer-screen-displaying-code-and-terminal-prompts-N4pwMINNNL8" target="_blank" rel="noopener noreferrer">{pageCopy.creditBernd}</a>{pageCopy.creditsAnalysis}<a href="https://unsplash.com/photos/laptop-screen-displaying-code-and-data-charts-GQOylIn892U" target="_blank" rel="noopener noreferrer">{pageCopy.creditDaniil}</a>{pageCopy.creditsServers}<a href="https://unsplash.com/photos/a-rack-of-servers-in-a-server-room-2JJ3wBHu4_0" target="_blank" rel="noopener noreferrer">{pageCopy.creditKevin}</a>{pageCopy.creditsMicrofluidics}<a href="https://www.oist.jp/image/photograph-microfluidic-devices-microbionanofluidics-unit" target="_blank" rel="noopener noreferrer">{pageCopy.creditOist}</a>{pageCopy.creditsWafer}<a href="https://www.oist.jp/image/silicon-wafer-deposition-chamber-oist-engineering-section" target="_blank" rel="noopener noreferrer">{pageCopy.creditOist}</a>{pageCopy.creditsPersonal}</p>
        </details>
        <p className={styles.copyright}>{pageCopy.copyright}</p>
      </footer>

      <LegacyInteractions />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
    </div>
  );
}
