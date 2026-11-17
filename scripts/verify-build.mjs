import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(`${dir}/${e.name}`):`${dir}/${e.name}`))).flat();}
const missing=new Set();let references=0;
for(const path of [...await files('src'),...await files('out')].filter(p=>/\.(tsx?|css|html)$/.test(p))){
 const text=await readFile(path,'utf8');
 for(const match of text.matchAll(/(?:["'`(]|&quot;)(\/images\/[^\s"'`)<>&]+?\.(?:webp|png|jpe?g|svg|mp4|webm))(?:[?#][^\s"'`)<>&]*)?/g)){
  const ref=match[1];if(ref.includes('${'))continue;
  references++;try{assert((await stat(resolve('public','.'+ref))).isFile());}catch{missing.add(ref);}
 }
}
assert.deepEqual([...missing],[],`Missing literal assets: ${[...missing]}`);
for(const route of ['index.html','en/index.html']){
 const html=await readFile('out/'+route,'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${route}: one h1`);
 assert(html.includes('https://yuto-matsui.com'),'canonical domain');
 assert(!html.includes('/habitat/night-v1/top.webp'),'COMPASS image dependency removed');
 for(const m of html.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)[^"]*"/g))assert((await stat('out'+m[1])).isFile(),m[1]);
}
// Exactly one Pages Function (the Contact endpoint); every other path stays static.
assert.deepEqual((await files('functions')).sort(),['functions/api/contact.ts'],'only the Contact Function exists');
assert.deepEqual(JSON.parse(await readFile('out/_routes.json','utf8')),{version:1,include:['/api/contact'],exclude:[]},'Functions run only for /api/contact');
{let exists=false;try{await stat('out/_worker.js');exists=true;}catch{}assert(!exists,'out/_worker.js: no advanced-mode worker');}
{
 const html=await readFile('out/contact/index.html','utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'contact: one h1');
 assert(html.includes('<link rel="canonical" href="https://yuto-matsui.com/contact/"/>'),'contact canonical');
 assert(/<meta name="robots" content="noindex, follow"\/>/.test(html),'contact is not indexed');
 assert(!/compass-official\.pages\.dev|COMPASS|代表/.test(html),'contact carries no COMPASS routing or representative wording');
 for(const m of html.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)[^"]*"/g))assert((await stat('out'+m[1])).isFile(),m[1]);
 assert(!(await readFile('out/sitemap.xml','utf8')).includes('/contact/'),'contact stays out of the sitemap');
}
// A production build must carry its own Turnstile site key, never the public test key.
if(process.env.CF_PAGES_BRANCH==='main'){const key=process.env.NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY?.trim()??'';assert(key&&!key.startsWith('1x000000')&&!key.startsWith('2x000000')&&!key.startsWith('3x000000'),'production Turnstile site key');}
for(const path of ['robots.txt','sitemap.xml','1692e67b895d46c0b6124bd047f73fcd.txt','_headers'])await stat('out/'+path);
console.log(`Verified two portfolio routes, the Contact route, ${references} literal image references, exported assets, and the single-Function boundary. Runtime-composed paths are checked by network E2E.`);

const deliveryHeaders=await readFile('out/_headers','utf8');
assert(/X-Portfolio-Commit: [a-f0-9]{40}/.test(deliveryHeaders),'deployment identity header');
for(const [source,target]of [['index.html','founder/index.html'],['robots.txt','founder-robots.txt'],['sitemap.xml','founder-sitemap.xml']])assert((await readFile('out/'+source)).equals(await readFile('out/'+target)),'cutover compatibility: '+target);
