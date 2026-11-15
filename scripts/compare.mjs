import { chromium } from '@playwright/test';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { gzipSync,gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const mode=process.argv[2];
if(!['capture','check'].includes(mode)) throw new Error('Usage: npm run compare -- capture|check [origin] [directory]');
const origin=process.argv[3] || (mode==='capture'?'https://yuto-matsui.com':'http://127.0.0.1:8798');
const directory=process.argv[4] || (mode==='capture'?'tests/compare/baseline':'comparison-results');
const baseline=process.env.BASELINE_DIR || 'tests/compare/baseline';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu','--disable-gpu-compositing','--force-color-profile=srgb']});
const matrix=[[390,844],[1024,768],[1280,720],[1275,553],[1536,672]];
const summary={observedAt:new Date().toISOString(),origin,sourceCommit:'6bb78ff59837c61fbf3322b7c4a3d43d1b5ab884',browser:browser.version(),platform:process.platform,mode,checks:[],policy:{motion:'reduced; CSS animations/transitions disabled',canvas:'masked only in screenshots; interactive tests required separately',analytics:'requests fulfilled locally; no analytics events sent',transport:'Next.js transport scripts/preloads recorded separately from semantic DOM'}};
const chosen=process.env.COMPARE_CASE;
for(const path of ['/','/en/']) for(const [width,height] of matrix) {
 const key=`${path==='/'?'ja':'en'}-${width}x${height}`;
 if(chosen && !key.includes(chosen))continue;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:'ja-JP',timezoneId:'Asia/Tokyo',reducedMotion:'reduce',serviceWorkers:'block'});
 const failures=[],compass=[],errors=[],resources=[];
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(/(^|\.)(googletagmanager\.com|google-analytics\.com|cloudflareinsights\.com)$/.test(u.hostname)) {await route.fulfill({status:200,contentType:'application/javascript',body:''});return;}
  if(!['GET','HEAD'].includes(req.method())){failures.push(`Blocked mutation ${req.method()} ${u.origin}${u.pathname}`);await route.abort();return;}
  if(u.hostname==='compass-official.pages.dev')compass.push(u.pathname);
  await route.continue();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>failures.push(`${r.url()} ${r.failure()?.errorText}`));
 page.on('response',r=>{resources.push({url:r.url(),status:r.status(),type:r.request().resourceType()});if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
 const response=await page.goto(origin+path,{waitUntil:'load'});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(1000);
 await page.waitForLoadState('networkidle');
 await page.addStyleTag({content:'*,*::before,*::after { animation: none !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }'});
 async function capture(label) {
  const screenshot=await page.screenshot({fullPage:true,animations:'disabled',mask:[page.locator('canvas')],maskColor:'#808080'});
  const data=await page.evaluate(({origin})=>{
   function norm(s){return s.replaceAll(origin,'https://yuto-matsui.com').replaceAll('/habitat/night-v1/top.webp','/images/founder-products/compass/top.webp').replace(/\b([\w-]+?_[\w-]+?)__[\w-]+/g,'$1__HASH').replace(/__(Manrope|Newsreader)(?:_Fallback)?_[a-zA-Z0-9]+/g,m=>m.replace(/_[a-zA-Z0-9]+$/,'_HASH'));}
   const skip=e=>e.tagName==='SCRIPT'&&(!e.type||e.type!=='application/ld+json') || e.tagName==='LINK'&&['stylesheet','preload','modulepreload'].includes(e.rel) || e.tagName==='STYLE';
   const elements=[...document.querySelectorAll('*')].filter(e=>!skip(e)&&!e.closest('script,style')&&!e.closest('canvas'));
   const dom=elements.map(e=>({tag:e.tagName,attributes:Object.fromEntries([...e.attributes].sort((a,b)=>a.name.localeCompare(b.name)).map(a=>[a.name,norm(a.value)])),text:[...e.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).filter(t=>!(t.includes('\n')&&!t.trim()))}));
   const styles=elements.filter(e=>e instanceof HTMLElement||e instanceof SVGElement).map(e=>{
    const style=getComputedStyle(e);return Object.fromEntries([...style].sort().map(k=>[k,norm(style.getPropertyValue(k))]));
   });
   const transport=[...document.querySelectorAll('script,link[rel=stylesheet],link[rel=preload]')].map(e=>e.outerHTML);
   return {dom,styles,transport};
  },{origin});
  await writeFile(`${directory}/${key}-${label}.json.gz`,gzipSync(JSON.stringify(data)));
  await writeFile(`${directory}/${key}-${label}.png`,screenshot);
  if(mode==='check'){
   const expected=JSON.parse(gunzipSync(await readFile(`${baseline}/${key}-${label}.json.gz`)));
   const actual=PNG.sync.read(screenshot),ref=PNG.sync.read(await readFile(`${baseline}/${key}-${label}.png`));
   let pixels=null;
   if(actual.width===ref.width&&actual.height===ref.height){const diff=new PNG({width:actual.width,height:actual.height});pixels=pixelmatch(ref.data,actual.data,diff.data,actual.width,actual.height,{threshold:0,includeAA:true});if(pixels)await writeFile(`${directory}/${key}-${label}-diff.png`,PNG.sync.write(diff));}
   const differences={};
   for(const field of ['dom','styles'])if(JSON.stringify(data[field])!==JSON.stringify(expected[field])){
     differences[field]=[];
     for(let i=0;i<Math.max(data[field].length,expected[field].length);i++)if(JSON.stringify(data[field][i])!==JSON.stringify(expected[field][i])){differences[field].push({index:i,expected:expected[field][i],actual:data[field][i]});if(differences[field].length>=15)break;}
   }
   if(Object.keys(differences).length)await writeFile(`${directory}/${key}-${label}-differences.json`,JSON.stringify(differences,null,2));
   summary.checks.push({key,label,domEqual:!differences.dom,stylesEqual:!differences.styles,pixels,dimensionsEqual:actual.width===ref.width&&actual.height===ref.height});
  }
 }
 await capture('initial');
 const total=await page.evaluate(()=>document.documentElement.scrollHeight);
 for(let y=0;y<total;y+=Math.floor(height*.8)){
   await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(120);
   await page.waitForLoadState('networkidle');
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-fragment-film],[data-mobile-fragment-film]')].filter(e=>e.checkVisibility()&&e.getBoundingClientRect().top<innerHeight&&e.getBoundingClientRect().bottom>0).every(e=>e.getAttribute('data-ready')==='true'),{},{timeout:30000});
 }
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(120);
 await page.waitForFunction(()=>[...document.images].filter(i=>i.loading!=='lazy'||(i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0)).every(i=>i.complete),{},{timeout:15000});
 await capture('scrolled');
 if(width<901){const name=path==='/'?'外部リンクを表示':'Open navigation';await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(120);await capture('menu');await page.keyboard.press('Escape');}
 const report={key,status:response.status(),headers:await response.allHeaders(),failures,compassRequests:compass,errors,resources};
 await writeFile(`${directory}/${key}-network.json`,JSON.stringify(report,null,2));
 summary.checks.push({key,network:failures.length===0,runtime:errors.length===0,compassRequests:compass.length});
 console.log(key,`status=${report.status} errors=${errors.length} failed=${failures.length} compass=${compass.length}`);
 await context.close();
}
await browser.close();
summary.passed=summary.checks.every(c=>c.domEqual!==false&&c.stylesEqual!==false&&c.dimensionsEqual!==false&&(c.pixels===undefined||c.pixels===0)&&c.network!==false&&c.runtime!==false&&(mode==='capture'||!c.compassRequests));
await writeFile(`${directory}/summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify({passed:summary.passed,checks:summary.checks.length,directory}));
if(!summary.passed)process.exitCode=1;
