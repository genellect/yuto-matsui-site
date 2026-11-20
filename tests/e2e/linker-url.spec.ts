import { test, expect } from '../support/responsive-fixture';

// Deliberately delayed tag: the incoming linker must survive config and both
// identity reads. Actual Google tag/cookie behavior is tested separately.
const tag = `(() => {
  const commands = window.dataLayer = window.dataLayer || [];
  window.__tagProbe = { configs: [], pending: [], historyCalls: 0 };
  const probe = window.__tagProbe;
  const originalReplace = history.replaceState;
  history.replaceState = function(...args) { probe.historyCalls++; return originalReplace.apply(this,args); };
  function consume(command) {
    if(command[0] === 'config') probe.configs.push({id:command[1],url:location.href});
    if(command[0] === 'get') probe.pending.push({field:command[2],callback:command[3]});
  }
  commands.forEach(consume);
  commands.push = function(...items) { items.forEach(consume); return Array.prototype.push.apply(this,items); };
  probe.release = value => probe.pending.shift().callback(value);
})();`;

for (const path of ['/', '/en/']) {
  test(`${path}: consume linker before cosmetic cleanup; preserve query, hash and history`, async ({page}) => {
    await page.route('https://www.googletagmanager.com/gtag/js?**', route => route.fulfill({contentType:'application/javascript',body:tag}));
    await page.goto(path+'?utm_source=a%20b&custom=a%2Bb&_gl=one&_gl=two#top');
    await page.waitForFunction(() => (window as any).__tagProbe?.pending.length === 1);
    const before = await page.evaluate(() => {
      history.replaceState({...history.state, preserved:'yes'},'');
      return {length:history.length,calls:(window as any).__tagProbe.historyCalls};
    });
    expect(new URL(page.url()).searchParams.getAll('_gl')).toEqual(['one','two']);
    const configs = await page.evaluate(() => (window as any).__tagProbe.configs);
    expect(configs).toHaveLength(1);
    expect(configs[0].id).toBe('G-EHKJ8B8N0Y');
    expect(new URL(configs[0].url).searchParams.has('_gl')).toBe(true);
    await page.evaluate(() => (window as any).__tagProbe.release('test-client'));
    expect(new URL(page.url()).searchParams.has('_gl')).toBe(true);
    await page.evaluate(() => (window as any).__tagProbe.release('test-session'));
    await expect.poll(() => new URL(page.url()).search).toBe('?utm_source=a%20b&custom=a%2Bb');
    expect(new URL(page.url()).hash).toBe('#top');
    expect(await page.evaluate(() => ({length:history.length,calls:(window as any).__tagProbe.historyCalls,state:history.state.preserved}))).toEqual({...before,state:'yes'});
    // A hash traversal must also remove a later linker without losing the hash.
    await page.evaluate(() => {history.pushState(history.state,'',location.pathname+'?custom=a%2Bb&_gl=later#top');location.hash='products';});
    await expect.poll(() => new URL(page.url()).searchParams.has('_gl')).toBe(false);
    expect(new URL(page.url()).hash).toBe('#products');
    expect(new URL(page.url()).search).toBe('?custom=a%2Bb');
  });

  test(`${path}: keep incoming linker when Google tag cannot resolve identity`, async ({page}) => {
    await page.route('https://www.googletagmanager.com/gtag/js?**', route => route.fulfill({contentType:'application/javascript',body:tag}));
    await page.goto(path+'?_gl=unconsumed#top');
    await page.waitForFunction(() => (window as any).__tagProbe?.pending.length === 1);
    await page.evaluate(() => (window as any).__tagProbe.release(undefined));
    await page.evaluate(() => {dispatchEvent(new Event('pageshow'));location.hash='products';});
    await expect.poll(() => new URL(page.url()).hash).toBe('#products');
    expect(new URL(page.url()).searchParams.get('_gl')).toBe('unconsumed');
  });
}

test('JP ↔ EN stays on Preview and removes consumed linker in both languages', async ({page}) => {
  await page.route('https://www.googletagmanager.com/gtag/js?**', route => route.fulfill({contentType:'application/javascript',body:tag}));
  await page.goto('/?_gl=incoming');
  const origin = new URL(page.url()).origin;
  for (const language of ['EN','JP','EN']) {
    await page.waitForFunction(() => (window as any).__tagProbe?.pending.length === 1);
    await page.evaluate(() => { (window as any).__tagProbe.release('test-client'); (window as any).__tagProbe.release('test-session'); });
    await expect.poll(() => new URL(page.url()).searchParams.has('_gl')).toBe(false);
    await page.locator('footer').getByRole('link',{name:language,exact:true}).click();
    await expect(page).toHaveURL(origin+(language==='EN'?'/en/':'/'));
  }
});

for (const path of ['/', '/en/']) for (const mobile of [false,true]) {
  test(`${path} ${mobile?'Mobile':'Desktop'}: every visible section link keeps a clean URL`, async ({page}) => {
    await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.route('https://www.googletagmanager.com/gtag/js?**', route => route.fulfill({contentType:'application/javascript',body:tag}));
    await page.goto(path+'?custom=a%2Bb&_gl=incoming');
    await page.waitForFunction(() => (window as any).__tagProbe?.pending.length === 1);
    await page.evaluate(() => { (window as any).__tagProbe.release('test-client'); (window as any).__tagProbe.release('test-session'); });
    // Mobile section links live in each language's full-screen menu.
    const menuId=path==='/en/'?'english-mobile-menu':'japanese-mobile-menu';
    const closeName=path==='/en/'?'Close navigation':'Close';
    const openMenu = async () => {
      if(mobile) {
        const toggle=page.locator(`button[aria-controls="${menuId}"]`);
        if(await toggle.getAttribute('aria-expanded')!=='true') await toggle.click();
      }
    };
    await openMenu();
    const links=page.locator('a[href^="#"]');
    const targets:string[]=[];
    for(let i=0;i<await links.count();i++) if(await links.nth(i).isVisible()) {
      const href=await links.nth(i).getAttribute('href');
      if(href && href!=='#' && !targets.includes(href)) targets.push(href);
    }
    expect(targets.length).toBeGreaterThan(2);
    for(const target of targets) {
      if(mobile) {
        const toggle=page.locator(`button[aria-controls="${menuId}"]`);
        const needsMenu=await page.locator(`#${menuId} a[href="${target}"]`).count()>0;
        const isOpen=await toggle.getAttribute('aria-expanded')==='true';
        if(needsMenu && !isOpen) await toggle.click();
        if(!needsMenu && isOpen) await page.locator(`#${menuId}`).getByRole('button',{name:closeName,exact:true}).click();
      }
      // Reintroduce a consumed linker, including same-hash clicks where no
      // hashchange is fired. The click fallback must clean that case as well.
      await page.evaluate(target=>history.replaceState(history.state,'',location.pathname+'?custom=a%2Bb&_gl=later'+target),target);
      const candidates=page.locator(`a[href="${target}"]`);
      let link=candidates.first();
      for(let i=0;i<await candidates.count();i++) if(await candidates.nth(i).isVisible()){link=candidates.nth(i);break;}
      if(target==='#founder-main'||target==='#main') {
        await link.focus();
        await page.keyboard.press('Enter');
      } else await link.click();
      await expect.poll(()=>new URL(page.url()).search).toBe('?custom=a%2Bb');
      expect(new URL(page.url()).hash).toBe(target);
    }
  });
}
