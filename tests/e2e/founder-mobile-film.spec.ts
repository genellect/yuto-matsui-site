import { expect, test } from "../support/responsive-fixture";

for (const route of ["/","/en/"]) {
  test(`Mobile film: composition, controls and lifecycle ${route}`, async ({ page }, info) => {
    const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
    await page.addInitScript(()=>{
      for(const method of ['drawElements','drawArrays'] as const){
        const original=WebGL2RenderingContext.prototype[method];
        Object.defineProperty(WebGL2RenderingContext.prototype,method,{configurable:true,writable:true,value:function(this:WebGL2RenderingContext,...args:unknown[]){
          const canvas=this.canvas as HTMLCanvasElement;
          canvas.dataset.renderCommands=String(Number(canvas.dataset.renderCommands??0)+1);
          return Reflect.apply(original,this,args);
        }});
      }
    });
    await page.setViewportSize({width:390,height:844});
    await page.goto(route);
    const section=page.locator('#fragments');await section.scrollIntoViewIfNeeded();await section.getByRole('button',{name:'3D',exact:true}).click();
    const film=section.locator('[data-mobile-fragment-film]');
    await expect(film).toHaveAttribute('data-ready','true',{timeout:20000});
    await expect(section.locator('canvas:visible')).toHaveCount(1);
    await section.screenshot({path:info.outputPath(`mobile-${route.includes('en')?'en':'jp'}-390.png`)});
    const canvas=film.locator('canvas');const moving=await canvas.screenshot();await page.waitForTimeout(700);expect(Buffer.compare(moving,await canvas.screenshot())).not.toBe(0);
    const pause=film.getByRole('button',{name:/一時停止|Pause automatic/});await pause.click();
    // Pause eases the film to rest over a few frames; on slow software WebGL that
    // tail outlasts any fixed wait. Wait until drawing stops, then require stillness.
    const renders=()=>canvas.getAttribute('data-render-commands');
    await expect(async()=>{const before=await renders();await page.waitForTimeout(300);expect(await renders()).toBe(before);}).toPass({timeout:5000});
    const still=await canvas.screenshot(),stillRenders=await renders();await page.waitForTimeout(400);
    expect(Buffer.compare(still,await canvas.screenshot())).toBe(0);expect(await renders()).toBe(stillRenders);
    const viewport=film.locator('[role="group"]');
    const before=await viewport.getAttribute('data-current-photo');await film.getByRole('button',{name:/次の写真|Next image/}).click();
    await expect.poll(()=>viewport.getAttribute('data-current-photo')).not.toBe(before);
    await section.getByRole('button',{name:'Original',exact:true}).click();
    await expect(section.locator('[data-mobile-fragment-film]')).toHaveCount(0);
    await expect(section.locator('img:visible').first()).toBeVisible();
    await section.getByRole('button',{name:'3D',exact:true}).click();await expect(film).toHaveAttribute('data-ready','true');
    await page.setViewportSize({width:701,height:900});await expect(section.locator('[data-mobile-fragment-film]')).toHaveCount(0);await expect(section.locator('canvas')).toHaveCount(0);
    await page.setViewportSize({width:700,height:900});await expect(film).toHaveAttribute('data-ready','true');await expect(section.locator('canvas:visible')).toHaveCount(1);
    for (const [width,height] of [[320,568],[430,932]]) {
      await page.setViewportSize({width,height});await section.scrollIntoViewIfNeeded();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await section.screenshot({path:info.outputPath(`mobile-${route.includes('en')?'en':'jp'}-${width}.png`)});
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(viewport).toHaveAttribute('data-motion','still');
    await expect(viewport).toHaveAttribute('data-pending-textures','0');
    // Assert the actual GPU draw count and linked background state. Transparent
    // canvas screenshots include compositor-dithered CSS gradients underneath.
    const captureState=()=>canvas.evaluate(el=>({commands:el.getAttribute('data-render-commands'),styles:el.closest('#fragments')!.getAttribute('style')}));
    await canvas.screenshot({path:info.outputPath('reduced-motion.png')});
    const frozen=await captureState();expect(Number(frozen.commands)).toBeGreaterThan(0);
    await page.waitForTimeout(150);expect(await captureState()).toEqual(frozen);
    await film.getByRole('button',{name:/次の写真|Next image/}).click();
    expect(errors).toEqual([]);
    const products=page.locator('[data-products-cinematic]');
    await expect(products.locator('article')).toHaveCount(4);
    await expect(products.locator('[data-product="interactive"] a').first()).toHaveAttribute('href','https://compass-official.pages.dev/INTRO_Interactive/');
    if (route === '/') {
      await expect(products.locator('[data-product="cytellect"] a[href="https://github.com/genellect/cytellect"]')).toHaveAttribute('href','https://github.com/genellect/cytellect');
    }

  });
}

test('Mobile WebGL failure retains Original photographs',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,name:string,...args:unknown[]){if(name.startsWith('webgl'))return null;return Reflect.apply(original,this,[name,...args]);} as typeof original;});
  await page.goto('/');const section=page.locator('#fragments');await section.scrollIntoViewIfNeeded();await section.getByRole('button',{name:'3D',exact:true}).click();
  await expect(section).toHaveAttribute('data-fragment-view','original');await expect(section.locator('img:visible').first()).toBeVisible();
});

test.describe('iPhone-sized touch gestures',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  test('horizontal drag keeps its position and vertical touch scroll remains native',async({page,context},info)=>{
    await page.goto('/');const section=page.locator('#fragments');await section.scrollIntoViewIfNeeded();await section.getByRole('button',{name:'3D',exact:true}).click();
    const film=section.locator('[data-mobile-fragment-film]');
    // Await the lazy engine and its CDN texture requests before timing the ready state.
    await film.locator('canvas').waitFor({state:'attached'});
    await page.waitForLoadState('networkidle');
    await expect(film).toHaveAttribute('data-ready','true');
    const viewport=film.locator('[role="group"]');const bounds=await viewport.boundingBox();expect(bounds).not.toBeNull();
    await film.getByRole('button',{name:'写真フィルムの自動送りを一時停止',exact:true}).click();
    const y=bounds!.y+bounds!.height*.55;
    const cdp=await context.newCDPSession(page);
    const gesture=async(x:number,y:number,dx:number,dy:number)=>{
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+dy*i/8}]});await page.waitForTimeout(20);}
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    };
    const before=await viewport.getAttribute('data-current-photo');
    await gesture(350,y,-310,0);await expect.poll(()=>viewport.getAttribute('data-current-photo')).not.toBe(before);
    const scrollBefore=await page.evaluate(()=>scrollY);
    await gesture(190,y,0,-150);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(scrollBefore+30);
    await section.scrollIntoViewIfNeeded();await section.screenshot({path:info.outputPath('iphone-touch-film.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    const seen=new Set<string>();
    for(let i=0;i<19;i++){
      await expect(viewport).toHaveAttribute('data-pending-textures','0');
      seen.add((await viewport.getAttribute('data-current-photo'))!);
      const key=await viewport.getAttribute('data-current-photo');await film.getByRole('button',{name:'次の写真',exact:true}).click();
      await expect.poll(()=>viewport.getAttribute('data-current-photo')).not.toBe(key);
    }
    expect(seen.size).toBe(19);await cdp.detach();
  });
});
