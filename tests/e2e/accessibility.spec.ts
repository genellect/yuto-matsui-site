import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../support/responsive-fixture';

// WCAG 2.1 A/AA rules from axe-core, run on every public route at the Desktop and Mobile sizes
// the other browser tests use. No rule is disabled.
//
// `known` lists the violations that existed when this test was added (2026-11-18). Fixing them
// changes how the page looks or what a screen reader announces, so each fix is a separate T2 pull
// request approved by the owner. The test fails on any violation not listed here, and also when a
// listed one disappears, so the list can only shrink and always matches the site.
// Entries are `rule target`, with the build hash of CSS module class names removed.
const known: Record<string, string[]> = {
  '/ Desktop': [
    'label-content-name-mismatch .founder_wordmark',
    'label-content-name-mismatch button[aria-label="写真フィルムの自動送りを一時停止"]',
  ],
  '/ Mobile': [
    'scrollable-region-focusable .founder_fragmentReelViewport:nth-child(1)',
    'scrollable-region-focusable .founder_fragmentReelViewport:nth-child(2)',
  ],
  '/en/ Desktop': [
    'label-content-name-mismatch .english-founder_wordmark',
  ],
  '/en/ Mobile': [
    'label-content-name-mismatch .english-founder_wordmark',
  ],
  '/contact/ Desktop': [
    'label-content-name-mismatch .founder_wordmark',
  ],
  '/contact/ Mobile': [],
};

const routes = ['/', '/en/', '/contact/'] as const;
const layouts = [
  { name: 'Desktop', viewport: { width: 1440, height: 900 } },
  { name: 'Mobile', viewport: { width: 390, height: 844 } },
] as const;

// CSS module class names end in a build hash, e.g. `founder_wordmark__bz_0q`.
const withoutHash = (selector: string) => selector.replace(/__[A-Za-z0-9_-]{5}(?![A-Za-z0-9_-])/g, '');

for (const route of routes) for (const layout of layouts) {
  const key = `${route} ${layout.name}`;
  test(`${key}: WCAG 2.1 A/AA violations match the known list`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize(layout.viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await page.goto(route))?.status()).toBe(200);
    // Scroll once through the page so content revealed on scroll is in its final state.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) { await page.evaluate((top) => scrollTo(0, top), y); await page.waitForTimeout(100); }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForLoadState('networkidle');

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const found = violations.flatMap((v) => v.nodes.map((n) => `${v.id} ${withoutHash(n.target.join(' '))}`)).sort();
    const details = violations.map((v) => ({ rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.failureSummary) }));
    expect(found, `New violations fail; fixed ones must be removed from \`known\`.\n${JSON.stringify(details, null, 2)}`)
      .toEqual([...known[key]].sort());
  });
}
