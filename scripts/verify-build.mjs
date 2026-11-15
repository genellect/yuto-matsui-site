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
for(const path of ['functions','out/_worker.js','out/_routes.json']){let exists=false;try{await stat(path);exists=true;}catch{}assert(!exists,`${path}: standalone static export must not include Functions`);}
for(const path of ['robots.txt','sitemap.xml','1692e67b895d46c0b6124bd047f73fcd.txt','_headers'])await stat('out/'+path);
console.log(`Verified two routes, ${references} literal image references, exported assets, and static-only boundary. Runtime-composed paths are checked by network E2E.`);

const deliveryHeaders=await readFile('out/_headers','utf8');
assert(/X-Portfolio-Commit: [a-f0-9]{40}/.test(deliveryHeaders),'deployment identity header');
for(const [source,target]of [['index.html','founder/index.html'],['robots.txt','founder-robots.txt'],['sitemap.xml','founder-sitemap.xml']])assert((await readFile('out/'+source)).equals(await readFile('out/'+target)),'cutover compatibility: '+target);
