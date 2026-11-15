import {test,expect} from '../support/responsive-fixture';

for(const language of ['ja','en'] as const) for(const mobile of [false,true]) {
 test(`${language} ${mobile?'Mobile':'Desktop'}: assets, menus and language contract`,async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors:string[]=[],failed:string[]=[],compass:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push(r.url()));
  page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(new URL(r.url()).hostname==='compass-official.pages.dev')compass.push(r.url());});
  const response=await page.goto(language==='ja'?'/':'/en/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<height;y+=600){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(100);}
  await page.waitForLoadState('networkidle');
  const footer=page.locator('footer');
  await expect(footer.getByRole('link',{name:'JP',exact:true})).toHaveAttribute('href','/');
  await expect(footer.getByRole('link',{name:'EN',exact:true})).toHaveAttribute('href','https://yuto-matsui.com/en/');
  if(mobile){
   await page.evaluate(()=>scrollTo(0,0));
   const toggle=page.getByRole('button',{name:language==='ja'?'外部リンクを表示':'Open navigation',exact:true});
   await toggle.click();await expect(page.locator('button[aria-expanded="true"]')).toHaveCount(1);
   await page.keyboard.press('Escape');await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(toggle).toBeFocused();
  }
  expect(failed).toEqual([]);expect(compass).toEqual([]);expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('English statement opens and closes without losing the full text',async({page})=>{
 await page.goto('/en/');
 const content=page.locator('#english-statement-continuation');
 await expect(content).toBeHidden();
 await page.getByRole('button',{name:'Read the full statement',exact:true}).click();
 await expect(content).toBeVisible();await expect(content).toContainText('If that foundation can help science move faster');
 await page.getByRole('button',{name:'Close statement',exact:true}).click();await expect(content).toBeHidden();
});
