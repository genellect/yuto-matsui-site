import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {inspectDeployment} from '../scripts/deployment-readiness.mjs';

test('deployment readiness distinguishes document release from cached static metadata',async t=>{
 const current='a'.repeat(40),previous='b'.repeat(40);
 const state={staleDocument:false,wrongAsset:false,unavailable:false,noindex:false};
 const server=createServer(async(req,res)=>{
  const document=req.url==='/'||req.url==='/en/';
  res.setHeader('X-Portfolio-Commit',document&&!state.staleDocument?current:previous);
  if(state.noindex)res.setHeader('X-Robots-Tag','noindex');
  if(state.unavailable&&req.url==='/en/'){res.writeHead(522);res.end('not ready');return;}
  if(document){res.end('<h1>Portfolio</h1><script id="portfolio-linker-url-cleanup">G-EHKJ8B8N0Y</script>');return;}
  if(state.wrongAsset&&req.url==='/robots.txt'){res.end('old content');return;}
  res.end(await readFile(new URL('../public'+req.url,import.meta.url)));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const origin='http://127.0.0.1:'+server.address().port;
 await t.test('unchanged static bytes with prior commit header are accepted',async()=>assert.equal((await inspectDeployment(origin,current)).ready,true));
 await t.test('a prior document release is rejected',async()=>{state.staleDocument=true;assert.equal((await inspectDeployment(origin,current)).ready,false);state.staleDocument=false;});
 await t.test('stale static contents are rejected despite successful HTTP',async()=>{state.wrongAsset=true;const r=await inspectDeployment(origin,current);assert(r.observations.find(x=>x.path==='/robots.txt').issues.includes('static body mismatch'));state.wrongAsset=false;});
 await t.test('partial rollout remains unready until both language routes recover',async()=>{state.unavailable=true;assert.equal((await inspectDeployment(origin,current)).ready,false);state.unavailable=false;assert.equal((await inspectDeployment(origin,current)).ready,true);});
 await t.test('noindex on production is still rejected',async()=>{state.noindex=true;assert.equal((await inspectDeployment(origin,current)).ready,false);});
});
