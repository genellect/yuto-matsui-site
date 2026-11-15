import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const pages=['/','/en/'];
const assets=['/robots.txt','/sitemap.xml','/images/compass-mark.svg'];
const sha256=body=>createHash('sha256').update(body).digest('hex');

// Cached static bytes can be current while an unchanged ETag retains an older
// release header. Documents identify the release; static bodies identify assets.
export async function inspectDeployment(origin,commit){
 const observations=await Promise.all([...pages,...assets].map(async path=>{
  const result={path,issues:[]};
  try{
   const response=await fetch(origin+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
   result.status=response.status;result.observedCommit=response.headers.get('x-portfolio-commit');
   if(response.status!==200){result.issues.push('HTTP '+response.status);return result;}
   if((response.headers.get('x-robots-tag')||'').toLowerCase().includes('noindex'))result.issues.push('production noindex');
   const body=Buffer.from(await response.arrayBuffer());
   if(pages.includes(path)){
    if(result.observedCommit!==commit)result.issues.push('document commit mismatch');
    const html=body.toString('utf8');
    if(!html.includes('portfolio-linker-url-cleanup')||!html.includes('G-EHKJ8B8N0Y')||(html.match(/<h1\b/g)||[]).length!==1)result.issues.push('document content mismatch');
   }else{
    result.bodySha256=sha256(body);result.expectedSha256=sha256(await readFile(new URL('../public'+path,import.meta.url)));
    if(result.bodySha256!==result.expectedSha256)result.issues.push('static body mismatch');
   }
  }catch(error){result.issues.push(error.message);}
  return result;
 }));
 return {ready:observations.every(r=>r.issues.length===0),observations};
}
