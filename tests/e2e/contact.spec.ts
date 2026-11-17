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

async function fill(page: Page, values: { topic?: 'お仕事のご依頼' | '学生からの相談'; grade?: string; name?: string; affiliation?: string; email?: string; details?: string } = {}) {
  const topic = values.topic ?? 'お仕事のご依頼';
  await page.getByRole('radio', { name: topic }).check();
  await page.locator('#affiliation').fill(values.affiliation ?? (topic === '学生からの相談' ? '北里大学' : '株式会社サンプル 開発部'));
  if (topic === '学生からの相談') await page.locator('#grade').selectOption(values.grade ?? '2年');
  await page.locator('#name').fill(values.name ?? '山田 花子');
  await page.locator('#email').fill(values.email ?? 'hanako@example.com');
  await page.locator('#details').fill(values.details ?? '共同研究についてご相談させてください。よろしくお願いいたします。');
}

const submit = (page: Page) => page.getByRole('button', { name: /送信する|送信しています/ });

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
      expect(await page.locator('#verificationCode').count()).toBe(0);
      // The whole form is visible at once, with the first choice selected.
      await expect(page.getByRole('radio')).toHaveCount(2);
      await expect(page.getByRole('radio', { name: 'お仕事のご依頼' })).toBeChecked();
      await expect(page.getByRole('radio', { name: '学生からの相談' })).not.toBeChecked();
      await expect(page.locator('label[for="affiliation"]')).toHaveText('会社名・所属');
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#details')).toBeVisible();
      await expect(submit(page)).toBeVisible();
      await expect(page.locator('#contact-flow h2')).toHaveCount(0);
      expect(text).not.toMatch(/その他|スカウト|気軽|後輩|拝読し、ご記入/);
      await page.waitForLoadState('networkidle');
      expect(compass).toEqual([]);
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test('the film adds no text beyond the heading, and Skip reaches the form', async ({ page }) => {
      // Hold the film and the page clock so the entrance stays on screen for inspection.
      await page.route('**/*.mp4', () => new Promise<void>(() => {}));
      await page.clock.install();
      await page.goto('/contact/');
      await expect(page.getByRole('heading', { name: 'お問い合わせ', level: 1 })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
      await expect(page.getByRole('status')).toHaveCount(0);
      await expect(page.locator('[data-contact-entrance]')).toHaveText(/^\s*スキップ\s*→?\s*$/);
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

    test('header and footer lead back to the portfolio; a return visit skips the film', async ({ page }) => {
      await page.goto('/contact/');
      await expect(page.locator('#contact-flow')).toBeVisible({ timeout: 4000 });
      await expect(page.locator('header').getByRole('link', { name: 'Yuto Matsui' })).toHaveAttribute('href', '/');
      // The portfolio's own header: wordmark home, its sections, Contact as the current page.
      const header = page.locator('[data-contact-header]');
      await expect(header.getByRole('link', { name: 'Yuto Matsui ポートフォリオの先頭へ' })).toHaveAttribute('href', '/');
      await expect(header.getByRole('link', { name: 'ポートフォリオ', exact: true })).toHaveCount(0);
      if (layout.name === 'Desktop') {
        await expect(header.getByRole('link', { name: 'Expertise' })).toHaveAttribute('href', '/#expertise');
        await expect(header.getByRole('link', { name: 'Off Hours' })).toHaveAttribute('href', '/#off-hours');
        await expect(header.getByRole('link', { name: 'EN', exact: true })).toHaveAttribute('href', '/en/');
      } else {
        await expect(header.getByRole('link', { name: 'Message' })).toHaveAttribute('href', '/#message');
      }
      await expect(header.getByRole('link', { name: 'Contact' }).filter({ visible: true })).toHaveAttribute('aria-current', 'page');
      // The top page's footer, with Back to top pointing at this page.
      const footer = page.locator('[data-contact-footer]');
      await expect(footer.getByRole('link', { name: /Back to top/ })).toHaveAttribute('href', '#contact-top');
      await expect(footer.getByRole('link', { name: 'EN', exact: true })).toHaveAttribute('href', '/en/');
      await expect(footer).toContainText('© 2026 Yuto Matsui. Designed and developed by Yuto Matsui. All rights reserved.');
      await page.reload();
      await expect(page.locator('#contact-flow')).toBeVisible();
      await expect(page.locator('video')).toHaveCount(0);
    });

    test('each choice opens its own fields; every field reports its own problem', async ({ page }) => {
      await issueTurnstileTokens(page);
      let requests = 0;
      await page.route('**/api/contact', (route) => { requests++; return route.fulfill({ status: 200, body: '{"ok":true}' }); });
      await page.goto('/contact/');
      await enterByBypass(page);

      await page.getByRole('radio', { name: 'お仕事のご依頼' }).check();
      await expect(page.locator('label[for="affiliation"]')).toHaveText('会社名・所属');
      await expect(page.locator('#grade')).toHaveCount(0);
      await expect(page.locator('#details-hint')).toHaveCount(0);
      await expect(submit(page)).toBeEnabled();
      await submit(page).click();
      await expect(page.locator('#affiliation-error')).toHaveText('会社名・所属を入力してください');
      await expect(page.locator('#name-error')).toHaveText('お名前を入力してください');
      await expect(page.locator('#email-error')).toHaveText('メールアドレスを入力してください');
      await expect(page.locator('#details-error')).toHaveText('ご用件を入力してください');
      await expect(page.locator('label[for="details"]')).toHaveText('ご用件');
      await expect(page.locator('#details')).not.toHaveAttribute('placeholder', /.+/);
      await expect(page.locator('#affiliation')).toBeFocused();

      // Switching keeps what both choices share and restores each choice's own affiliation.
      await page.locator('#affiliation').fill('株式会社サンプル');
      await page.locator('#name').fill('林');
      await page.getByRole('radio', { name: '学生からの相談' }).check();
      await expect(page.locator('label[for="affiliation"]')).toHaveText('大学名');
      await expect(page.locator('label[for="details"]')).toHaveText('ご相談内容');
      await expect(page.locator('#affiliation')).toHaveValue('');
      await expect(page.locator('#name')).toHaveValue('林');
      await expect(page.locator('#grade-error')).toHaveText('学年を選んでください');
      await expect(page.locator('#grade option')).toHaveText(['選択してください', '1年', '2年', '3年', '4年', '5年', '6年', '大学院']);
      await page.locator('#affiliation').fill('北里大学');
      await submit(page).click();
      await expect(page.locator('#grade')).toBeFocused();
      await page.getByRole('radio', { name: 'お仕事のご依頼' }).check();
      await expect(page.locator('#affiliation')).toHaveValue('株式会社サンプル');

      await page.locator('#email').fill('hanako@');
      await expect(page.locator('#email-error')).toHaveText('メールアドレスの形式を確認してください');
      await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#name-error')).toHaveCount(0);
      await submit(page).click();
      await expect(page.locator('#email')).toBeFocused();
      expect(requests).toBe(0);
      await expect(page.locator('#details')).toHaveAttribute('maxlength', '1000');
    });

    test('leaving with an unsent draft asks first', async ({ page }) => {
      await page.goto('/contact/');
      await enterByBypass(page);
      await fill(page);
      let dialogs = 0;
      page.on('dialog', (dialog) => { dialogs++; void dialog.dismiss(); });
      await page.locator('[data-contact-header]').getByRole('link', { name: 'Yuto Matsui ポートフォリオの先頭へ' }).click();
      await expect.poll(() => dialogs).toBe(1);
      await expect(page).toHaveURL(/\/contact\/$/);
      await expect(page.locator('#details')).toHaveValue(/共同研究/);
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
      await submit(page).click();
      await expect(alert).toBeVisible();
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
      await page.clock.fastForward(5000);
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
      // The sender keeps a record of what was sent.
      const receipt = page.getByRole('region', { name: '送信した内容' });
      await expect(receipt).toContainText('お仕事のご依頼');
      await expect(receipt).toContainText('株式会社サンプル 開発部');
      await expect(receipt).toContainText('山田 花子');
      await expect(receipt).toContainText('共同研究についてご相談させてください。');
      expect(bodies).toHaveLength(1);
      expect(Object.keys(bodies[0]).sort()).toEqual(['affiliation', 'details', 'email', 'grade', 'name', 'requestId', 'topic', 'turnstileToken', 'website']);
      expect(bodies[0]).toMatchObject({ topic: 'work', grade: '', name: '山田 花子', affiliation: '株式会社サンプル 開発部', email: 'hanako@example.com', website: '' });
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
      const alert = page.locator('[class*="notice"]');

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
