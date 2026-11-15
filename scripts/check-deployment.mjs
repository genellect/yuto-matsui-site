import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const [origin='https://yuto-matsui-site.pages.dev',sha,seconds='600']=process.argv.slice(2);
assert(/^[a-f0-9]{40}$/.test(sha||''),'Expected 40-character commit');
const start=Date.now(),deadline=start+Number(seconds)*1000;
let observed='';
while(true){
 try{
  const response=await fetch(origin+'/',{method:'HEAD',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(10000)});
  observed=response.headers.get('x-portfolio-commit')||'';
  if(response.status===200 && observed===sha)break;
 }catch(error){observed=error.message;}
 if(Date.now()>=deadline)throw new Error('Deployment did not become ready: '+observed);
 console.log('Waiting for deployment',sha,'at',origin);await delay(10000);
}
for(const path of ['/','/en/','/robots.txt','/sitemap.xml','/images/compass-mark.svg']){
 const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});
 assert.equal(response.status,200,path);
 assert.equal(response.headers.get('x-portfolio-commit'),sha,path+': deployment mismatch');
 assert(!(response.headers.get('x-robots-tag')||'').includes('noindex'),path+': production noindex');
 if(path==='/'||path==='/en/'){
  const html=await response.text();assert(html.includes('portfolio-linker-url-cleanup'));assert(html.includes('G-EHKJ8B8N0Y'));assert.equal((html.match(/<h1\b/g)||[]).length,1);
 }
}
execFileSync(process.execPath,['scripts/http-contract.mjs','check',origin],{stdio:'inherit'});
await mkdir('comparison-results',{recursive:true});
await writeFile('comparison-results/deployment.json',JSON.stringify({observedAt:new Date().toISOString(),origin,sha,waitMs:Date.now()-start,passed:true},null,2)+'\n');
console.log('Verified production deployment',sha,'at',origin);
