import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {inspectDeployment} from './deployment-readiness.mjs';

const [origin='https://yuto-matsui-site.pages.dev',sha,seconds='600']=process.argv.slice(2);
assert(/^[a-f0-9]{40}$/.test(sha||''),'Expected 40-character commit');
assert(Number.isFinite(Number(seconds))&&Number(seconds)>=0,'Expected nonnegative timeout');
const start=Date.now(),deadline=start+Number(seconds)*1000;
await mkdir('comparison-results',{recursive:true});
let readiness;
while(true){
 readiness=await inspectDeployment(origin,sha);
 if(readiness.ready)break;
 const issues=readiness.observations.filter(r=>r.issues.length).map(r=>`${r.path}: ${r.issues.join(', ')}`).join('; ');
 if(Date.now()>=deadline){
  await writeFile('comparison-results/deployment.json',JSON.stringify({observedAt:new Date().toISOString(),origin,sha,passed:false,...readiness},null,2)+'\n');
  throw new Error('Deployment did not become ready: '+issues);
 }
 console.log('Waiting for deployment',sha,'at',origin,issues);await delay(10000);
}
execFileSync(process.execPath,['scripts/http-contract.mjs','check',origin],{stdio:'inherit'});
await writeFile('comparison-results/deployment.json',JSON.stringify({observedAt:new Date().toISOString(),origin,sha,waitMs:Date.now()-start,passed:true,...readiness},null,2)+'\n');
console.log('Verified production deployment',sha,'at',origin);
