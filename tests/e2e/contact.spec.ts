import type { Page, Route } from '@playwright/test';
import { test, expect } from '../support/responsive-fixture';

// The fixture already blocks analytics, external forms and real POSTs to /api/contact.
// Each test that submits installs its own page-level mock; no message ever leaves the browser.

const layouts = [
  { name: 'Desktop', viewport: { width: 1440, height: 900 }, film: 'entry-desktop.mp4' },
  { name: 'Mobile', viewport: { width: 390, height: 844 }, film: 'entry-mobile.mp4' }
] as const;

const forbiddenWording = /COMPASS|代表|確認コード|自動返信|どちらへのご連絡|宛先/;

const turnstileIssuingTokens = String.raw`
(() => {
  let options;
  window.turnstile = {
    render(container, given) { options = given; container.dataset.testTurnstile = 'ready'; setTimeout(() => options.callback('test-token-1'), 20); return 'test-widget'; },
    reset() { setTimeout(() => options.callback('test-token-' + Date.now()), 20); },
    remove() {}
  };
})();`;

async function watch(page: Page) {
  const errors: string[] = [];
  const compass: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (new URL(request.url()).hostname.endsWith('compass-official.pages.dev')) compass.push(request.url()); });
  return { errors, compass };
}

async function issueTurnstileTokens(page: Page) {
  await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: turnstileIssuingTokens }));
}

/** The film starts on its own; skip it (if it is still playing) to reach the form. */
async function enterByBypass(page: Page) {
  const skip = page.getByRole('button', { name: /スキップ/ });
  if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
  await expect(page.locator('#contact-flow')).toBeVisible();
}

async function fill(page: Page, values: { name?: string; affiliation?: string; email?: string; details?: string } = {}) {
  await page.locator('#name').fill(values.name ?? '山田 花子');
  if (values.affiliation !== undefined) await page.locator('#affiliation').fill(values.affiliation);
  await page.locator('#email').fill(values.email ?? 'hanako@example.com');
  await page.locator('#details').fill(values.details ?? '共同研究についてご相談させてください。よろしくお願いいたします。');
}

const submit = (page: Page) => page.getByRole('button', { name: /メッセージを送信/ });

for (const layout of layouts) {
  test.describe(`${layout.name} Contact`, () => {
    test.beforeEach(async ({ page }) => { await page.setViewportSize(layout.viewport); });

    test('opening Contact plays the entry film at once and reaches the form', async ({ page }) => {
      const { errors, compass } = await watch(page);
      const filmRequests: string[] = [];
      page.on('request', (request) => { if (request.url().endsWith('.mp4')) filmRequests.push(new URL(request.url()).pathname); });
      const response = await page.goto('/contact/');
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle('Contact | Yuto Matsui / 松井優知');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://yuto-matsui.com/contact/');
      const codec = await page.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"'));
      // No door to choose: the film is mounted without any interaction.
      await expect(page.locator('video')).toHaveAttribute('src', `/images/contact-entry/${layout.film}`);
      await expect(page.locator('[data-door]')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /演出なしで入力へ|メッセージを書く/ })).toHaveCount(0);
      if (codec) await expect.poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0);
      // Natural end, load deadline or codec failure: all paths arrive within the 2.7s ceiling.
      await expect(page.locator('#contact-flow')).toBeVisible({ timeout: 4000 });
      // Nothing was pressed, so focus stays put and no focus ring appears on the heading.
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
      await expect(page.locator('#form-title')).toHaveCSS('outline-style', 'none');
      expect(filmRequests).toEqual([`/images/contact-entry/${layout.film}`]);

      const text = await page.locator('body').innerText();
      const labels = await page.locator('[aria-label]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')).join(' '));
      const meta = await page.locator('head').innerHTML();
      expect(text).not.toMatch(forbiddenWording);
      expect(labels).not.toMatch(forbiddenWording);
      expect(meta).not.toMatch(/COMPASSへ|代表|compass-official/);
      expect(await page.locator('input[type="radio"], #verificationCode').count()).toBe(0);
      await page.waitForLoadState('networkidle');
      expect(compass).toEqual([]);
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test('the film shows its status and Skip reaches the form without moving focus on load', async ({ page }) => {
      // Hold the film and the page clock so the entrance stays on screen for inspection.
      await page.route('**/*.mp4', () => new Promise<void>(() => {}));
      await page.clock.install();
      await page.goto('/contact/');
      await expect(page.getByRole('heading', { name: 'Yuto Matsuiへのご連絡', level: 2 }).first()).toBeVisible();
      await expect(page.getByRole('status')).toHaveText('Yuto Matsui — 入室しています');
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
      await page.getByRole('button', { name: /スキップ/ }).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#contact-flow')).toBeVisible();
      await expect(page.locator('#form-title')).toBeFocused();
      // The heading is a focus target, not a control: no ring even after keyboard use.
      await expect(page.locator('#form-title')).toHaveCSS('outline-style', 'none');
    });

    test('reduced motion, Save-Data, failed and stalled films go straight to the form', async ({ page, context }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/contact/');
      await expect(page.locator('#contact-flow')).toBeVisible();
      await expect(page.locator('video')).toHaveCount(0);

      const saveData = await context.newPage();
      await saveData.setViewportSize(layout.viewport);
      await saveData.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }));
      await saveData.goto('/contact/');
      await expect(saveData.locator('#contact-flow')).toBeVisible();
      await expect(saveData.locator('video')).toHaveCount(0);
      await saveData.close();

      for (const handler of [
        (route: Route) => route.fulfill({ status: 404, body: '' }),
        () => new Promise<void>(() => {}) // never answers: the 800ms load deadline applies
      ]) {
        const film = await context.newPage();
        await film.setViewportSize(layout.viewport);
        await film.route('**/*.mp4', handler);
        await film.goto('/contact/');
        await expect(film.locator('#contact-flow')).toBeVisible({ timeout: 2500 });
        await film.close();
      }
    });

    test('header CONTACT returns to the top of the form and the draft survives', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/contact/');
      await expect(page.locator('#contact-flow')).toBeVisible();
      await fill(page, { affiliation: '北里大学' });
      await page.locator('#details').focus();
      await page.getByRole('link', { name: 'CONTACT — お問い合わせの先頭へ' }).click();
      await expect(page).toHaveURL(/\/contact\/$/);
      await expect(page.locator('#form-title')).toBeFocused();
      await expect(page.locator('video')).toHaveCount(0);
      await expect(page.locator('#name')).toHaveValue('山田 花子');
      await expect(page.locator('#affiliation')).toHaveValue('北里大学');
      await expect(page.locator('#details')).toHaveValue(/共同研究/);
      expect(await page.evaluate(() => scrollY)).toBe(0);
    });

    test('field validation and the optional affiliation', async ({ page }) => {
      await issueTurnstileTokens(page);
      await page.goto('/contact/');
      await enterByBypass(page);
      await expect(page.locator('label[for="affiliation"]')).toContainText('任意');
      await expect(page.locator('#affiliation')).not.toHaveAttribute('required', '');
      await fill(page, { email: 'not-an-address' });
      await page.locator('#details').focus();
      await expect(page.locator('#email-error')).toHaveText('正しい形式で入力してください');
      await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
      await expect(submit(page)).toBeDisabled();
      await page.locator('#email').fill('hanako@example.com');
      await page.locator('#affiliation').fill('A');
      await expect(submit(page)).toBeDisabled();
      await page.locator('#affiliation').fill('');
      await expect(submit(page)).toBeEnabled();
      await expect(page.locator('#details')).toHaveAttribute('maxlength', '1000');
    });

    test('blocked Turnstile script offers the email route without losing the draft', async ({ page }) => {
      await page.route('https://challenges.cloudflare.com/**', (route) => route.abort('blockedbyclient'));
      await page.goto('/contact/');
      await enterByBypass(page);
      await fill(page);

      const alert = page.getByRole('alert').filter({ hasText: '送信に必要な確認が完了していません' });
      const emailLink = alert.getByRole('link', { name: 'トップページ' });
      await expect(emailLink).toHaveAttribute('href', '/#contact-cta');
      await expect(emailLink).toHaveAttribute('target', '_blank');
      await expect(submit(page)).toBeDisabled();
      await expect(page.locator('#email')).toHaveValue('hanako@example.com');
      await expect(page.locator('#details')).toHaveValue(/共同研究について/);
    });

    test('a stalled Turnstile offers email and recovers when a token arrives', async ({ page }) => {
      await page.clock.install();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile = {
          render(container, options) {
            container.dataset.testTurnstile = 'waiting';
            setTimeout(() => options.callback('test-token'), 20000);
            return 'test-widget';
          },
          remove() {}
        };`
      }));
      await page.goto('/contact/');
      await expect(page.locator('[data-test-turnstile="waiting"]')).toBeAttached();
      await fill(page);

      const alert = page.getByRole('alert').filter({ hasText: '送信に必要な確認が完了していません' });
      await page.clock.fastForward(16000);
      await expect(alert.getByRole('link', { name: 'トップページ' })).toBeVisible();
      await expect(submit(page)).toBeDisabled();
      await page.clock.fastForward(5000);
      await expect(submit(page)).toBeEnabled();
      await expect(alert).toHaveCount(0);
      await expect(page.locator('#details')).toHaveValue(/共同研究について/);
    });

    test('successful message: one request with only the expected fields', async ({ page }) => {
      await issueTurnstileTokens(page);
      const bodies: Record<string, unknown>[] = [];
      await page.route('**/api/contact', async (route) => {
        bodies.push(route.request().postDataJSON());
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      });
      await page.goto('/contact/');
      await enterByBypass(page);
      await fill(page);
      await submit(page).click();
      await expect(page.getByRole('heading', { name: 'メッセージを承りました' })).toBeFocused();
      await expect(page.locator('body')).toContainText('ご連絡いただき、ありがとうございます。内容を拝読のうえ、hanako@example.com 宛にご連絡いたします。');
      await expect(page.locator('body')).not.toContainText(/自動返信|受付メール|代表|COMPASS/);
      await expect(page.getByRole('link', { name: 'トップページへ', exact: true })).toHaveAttribute('href', '/');
      expect(bodies).toHaveLength(1);
      expect(Object.keys(bodies[0]).sort()).toEqual(['affiliation', 'details', 'email', 'name', 'requestId', 'turnstileToken', 'website']);
      expect(bodies[0]).toMatchObject({ name: '山田 花子', affiliation: '', email: 'hanako@example.com', website: '' });
    });

    test('failures keep the draft, apologise and offer the email route after repeated trouble', async ({ page }) => {
      await issueTurnstileTokens(page);
      const replies: Array<(route: Route) => Promise<void>> = [
        (route) => route.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"code":"delivery"}' }),
        (route) => route.fulfill({ status: 429, contentType: 'text/html', body: '<html><body>Too many requests</body></html>' }),
        (route) => route.fulfill({ status: 422, contentType: 'application/json', body: '{"ok":false,"code":"turnstile"}' }),
        (route) => route.abort('failed')
      ];
      let call = 0;
      await page.route('**/api/contact', (route) => replies[call++](route));
      await page.goto('/contact/');
      await enterByBypass(page);
      await fill(page);
      const alert = page.locator('[class*="statusError"]');

      await submit(page).click();
      await expect(alert).toContainText('申し訳ありません。ただいまメッセージをお送りできませんでした。');
      await expect(alert).not.toContainText('お急ぎの場合は');

      await expect(submit(page)).toBeEnabled();
      await submit(page).click();
      await expect(alert).toContainText('続けてお送りいただいたため');
      await expect(alert).toContainText('お急ぎの場合は、トップページに記載のメールアドレスからもご連絡いただけます。');
      await expect(alert.getByRole('link', { name: 'トップページ' })).toHaveAttribute('href', '/#contact-cta');

      await expect(submit(page)).toBeEnabled();
      await submit(page).click();
      await expect(alert).toHaveText('確認が完了しませんでした。お手数ですが、もう一度お試しください。');

      await expect(submit(page)).toBeEnabled();
      await submit(page).click();
      await expect(alert).toContainText('ご入力いただいた内容はそのまま残っています');

      await expect(page.locator('#name')).toHaveValue('山田 花子');
      await expect(page.locator('#email')).toHaveValue('hanako@example.com');
      await expect(page.locator('#details')).toHaveValue(/共同研究/);
      expect(call).toBe(4);
      expect(await alert.innerText()).not.toMatch(/エラー|失敗|できません。$/);
    });

    test('submit is disabled while sending so a double click sends once', async ({ page }) => {
      await issueTurnstileTokens(page);
      let requests = 0;
      let release!: () => void;
      const held = new Promise<void>((resolve) => { release = resolve; });
      await page.route('**/api/contact', async (route) => {
        requests++;
        await held;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      });
      await page.goto('/contact/');
      await enterByBypass(page);
      await fill(page);
      await submit(page).click();
      await expect(page.getByRole('button', { name: /送信しています/ })).toBeDisabled();
      await page.getByRole('button', { name: /送信しています/ }).click({ force: true });
      release();
      await expect(page.getByRole('heading', { name: 'メッセージを承りました' })).toBeVisible();
      expect(requests).toBe(1);
    });
  });
}

test('Japanese portfolio links to the personal Contact page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#contact-cta a[href="/contact/"]')).toHaveCount(1);
  await expect(page.locator('a[href*="compass-official.pages.dev/contact"]')).toHaveCount(0);
});
