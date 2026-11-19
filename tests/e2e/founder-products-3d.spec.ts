import { expect, test } from "../support/responsive-fixture";

test("Interactive retains animated WebGL and the shared pause control", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const products = page.locator("[data-products-cinematic]");
  const scene = products.locator('[data-product="interactive"] [data-ready="true"] canvas');
  await products.scrollIntoViewIfNeeded();
  await expect(scene).toBeVisible({ timeout: 30_000 });
  const first = await scene.screenshot();
  await page.waitForTimeout(800);
  expect(Buffer.compare(first, await scene.screenshot())).not.toBe(0);
  const pause = products.getByRole("button");
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await scene.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(650);
  const still = await scene.screenshot();
  await page.waitForTimeout(250);
  expect(Buffer.compare(still, await scene.screenshot())).toBe(0);
});

test("Product stills and links work before JavaScript", async ({ browser }, testInfo) => {
  for (const route of ["", "en"]) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      await page.goto(`${testInfo.project.use.baseURL}${route ? "/en/" : "/"}`);
      const products = page.locator("[data-products-cinematic]");
      for (const [key, naturalWidth] of [["cytellect", 1920], ["topos", 1280], ["platform", 1920]] as const) {
        const card = products.locator(`[data-product="${key}"]`);
        await card.scrollIntoViewIfNeeded();
        await expect.poll(() => card.locator("img").evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(route === "" && key === "cytellect" ? 2000 : naturalWidth);
        await expect(card.getByRole("link").first()).toBeVisible();
      }
      await expect(products.locator("article")).toHaveCount(4);
    } finally { await context.close(); }
  }
});

test("WebGL failure leaves all product destinations available", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, name: string, ...args: unknown[]) {
      if (name.startsWith("webgl") || name === "experimental-webgl") return null;
      return Reflect.apply(original, this, [name, ...args]);
    } as typeof original;
  });
  await page.goto("/en/");
  const products = page.locator("[data-products-cinematic]");
  await products.scrollIntoViewIfNeeded();
  await expect(products.locator("a")).toHaveCount(4);
  await expect(products.locator('[data-product="interactive"] svg').first()).toBeVisible();
  await expect(products.locator('[data-product="topos"] img')).toBeVisible();
  await expect(products.locator('[data-product="cytellect"] img')).toBeVisible();
  await expect(products.locator('[data-product="platform"] img')).toBeVisible();
});
