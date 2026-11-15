import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const sha=process.env.CF_PAGES_COMMIT_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(sha))throw new Error('Invalid deployment commit');
// During cutover Cloudflare's old URL rewrites can still target these paths.
// Keep byte-identical compatibility assets until the old rules are retired.
await mkdir('out/founder',{recursive:true});
for(const [source,target]of [['index.html','founder/index.html'],['robots.txt','founder-robots.txt'],['sitemap.xml','founder-sitemap.xml']])await copyFile('out/'+source,'out/'+target);
let headers=await readFile('out/_headers','utf8');
const blocks=headers.trimEnd().split(/\n\s*\n/);
for(const [source,target]of [['/','/founder/'],['/robots.txt','/founder-robots.txt'],['/sitemap.xml','/founder-sitemap.xml']]){
 const block=blocks.find(block=>block.split('\n')[0]===source);
 if(!block)throw new Error('Missing header contract for '+source);
 headers+='\n\n'+target+block.slice(source.length);
}
headers=headers.replace('/*\n','/*\n  X-Portfolio-Commit: '+sha+'\n');
await writeFile('out/_headers',headers.trimEnd()+'\n');
console.log('Delivery commit:',sha);
