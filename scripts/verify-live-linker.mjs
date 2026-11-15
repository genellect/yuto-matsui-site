import { chromium, expect } from '@playwright/test';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Exercise Google's real tag and configured cross-domain linker, while serving
// fixture origins locally inside Playwright. No collection request leaves it.
const root=resolve(process.env.SITE_BUILD_ROOT||'out');
const expectation=process.env.EXPECT_LINKER_CLEANUP||'clean';
const output=process.env.ANALYTICS_REPORT||'comparison-results/analytics.json';
const measurementId='G-EHKJ8B8N0Y';
const sourceOrigin='https://compass-official.pages.dev';
const destinationOrigin='https://yuto-matsui.com';
const browser=await chromium.launch();
const hits=[],arrivals=[],blocked=[],scriptLoads=[];
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
try {
 const context=await browser.newContext({locale:'ja-JP',timezoneId:'Asia/Tokyo',viewport:{width:1280,height:800},serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname==='www.googletagmanager.com'&&request.resourceType()==='script'&&request.method()==='GET'){
   scriptLoads.push(url.pathname);await route.continue();return;
  }
  if(/(^|\.)(google-analytics\.com|analytics\.google\.com)$/.test(url.hostname)){
   const bodies=(request.postData()||'').split('\n');
   for(const body of bodies){const values=new URLSearchParams(url.search);for(const [k,v]of new URLSearchParams(body))values.set(k,v);if(values.has('en'))hits.push(Object.fromEntries(values));}
   await route.fulfill({status:204,body:''});return;
  }
  if(url.origin===sourceOrigin){
   if(request.resourceType()!=='document'){await route.fulfill({status:204,body:''});return;}
   await route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');</script></head><body><a href="${destinationOrigin}/en/?utm_source=preserve%20source&custom=a%2Bb#top">Portfolio</a></body></html>`});return;
  }
  if(url.origin===destinationOrigin){
   if(!['GET','HEAD'].includes(request.method()))throw new Error('Unexpected application mutation');
   if(request.isNavigationRequest())arrivals.push(request.url());
   let path=resolve(root,'.'+decodeURIComponent(url.pathname));
   if(!path.startsWith(root+sep)&&path!==root)throw new Error('Invalid fixture path');
   try{if((await stat(path)).isDirectory())path=resolve(path,'index.html');await route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}
   catch{await route.fulfill({status:404,body:'Not found'});}
   return;
  }
  blocked.push({host:url.hostname,path:url.pathname,type:request.resourceType()});
  await route.fulfill({status:204,body:''});
 });
 const page=await context.newPage();
 const identities=async()=>{
  await page.waitForFunction(()=>typeof window.gtag==='function');
  return page.evaluate(id=>new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Google tag did not provide client/session IDs')),20000);
   window.gtag('get',id,'client_id',clientId=>window.gtag('get',id,'session_id',sessionId=>{clearTimeout(timer);resolve({clientId,sessionId});}));
  }),measurementId);
 };
 await page.goto(sourceOrigin+'/');
 const source=await identities();
 expect(source.clientId).toBeTruthy();expect(source.sessionId).toBeTruthy();
 await expect.poll(()=>hits.filter(h=>h.en==='page_view').length,{timeout:15000}).toBe(1);
 await page.getByRole('link',{name:'Portfolio',exact:true}).click();
 const first=await identities();
 expect(first).toEqual(source);
 const decorated=arrivals.find(url=>new URL(url).pathname==='/en/');
 expect(new URL(decorated).searchParams.has('_gl')).toBe(true);
 if(expectation==='clean')await expect.poll(()=>new URL(page.url()).searchParams.has('_gl')).toBe(false);
 else expect(new URL(page.url()).searchParams.has('_gl')).toBe(true);
 expect(new URL(page.url()).searchParams.get('utm_source')).toBe('preserve source');
 expect(new URL(page.url()).searchParams.get('custom')).toBe('a+b');
 expect(new URL(page.url()).hash).toBe('#top');
 const incomingCleanup= !new URL(page.url()).searchParams.has('_gl');
 await expect.poll(()=>hits.filter(h=>h.en==='page_view').length,{timeout:15000}).toBe(2);
 await page.locator('footer').getByRole('link',{name:'JP',exact:true}).click();
 await expect(page).toHaveURL(destinationOrigin+'/');
 expect(await identities()).toEqual(source);
 await expect.poll(()=>hits.filter(h=>h.en==='page_view').length,{timeout:15000}).toBe(3);
 await page.locator('footer').getByRole('link',{name:'EN',exact:true}).click();
 await expect.poll(()=>new URL(page.url()).pathname).toBe('/en/');
 expect(await identities()).toEqual(source);
 if(expectation==='clean')await expect.poll(()=>new URL(page.url()).searchParams.has('_gl')).toBe(false);
 // Let Google's batched collection requests flush into the interception boundary.
 await expect.poll(()=>hits.filter(h=>h.en==='page_view').length,{timeout:15000}).toBe(4);
 await page.waitForTimeout(1000);
 const views=hits.filter(h=>h.en==='page_view');
 expect(views).toHaveLength(4);
 expect(views.every(h=>h.cid===String(source.clientId)&&h.sid===String(source.sessionId))).toBe(true);
 const report={observedAt:new Date().toISOString(),expectation,measurementId,googleScriptLoads:scriptLoads.length,realLinkerParameterAdded:true,clientAndSessionPreserved:true,incomingCleanup,pageViews:views.length,pageViewPaths:views.map(h=>new URL(h.dl).pathname),collectionRequestsForwarded:0,otherRequestsIntercepted:blocked,passed:true};
 await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
