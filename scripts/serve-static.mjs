import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.STATIC_ROOT || 'out');
const port = Number(process.env.PORT || 8798);
// This server supports the exact-path and global rules used in this repository.
const rules = []; let active;
for (const line of (await readFile(resolve(root, '_headers'), 'utf8')).split('\n')) {
  if (line.startsWith('/')) { active = { path: line.trim(), headers: {} }; rules.push(active); }
  else if (active && /^\s+[^:]+:/.test(line)) {
    const index = line.indexOf(':'); active.headers[line.slice(0,index).trim()] = line.slice(index+1).trim();
  }
}
function headersFor(path) { return Object.assign({}, ...rules.filter(rule => rule.path === '/*' || rule.path === path).map(rule => rule.headers)); }
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm'};
createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const url=new URL(req.url,'http://localhost');
    let path=resolve(root,'.'+decodeURIComponent(url.pathname));
    if(path!==root && !path.startsWith(root+sep)) {res.writeHead(403).end();return;}
    if((await stat(path)).isDirectory()) {
      if(!url.pathname.endsWith('/')) {res.writeHead(308,{Location:url.pathname+'/'+url.search,'Access-Control-Allow-Origin':'*',...headersFor(url.pathname)}).end();return;}
      path=resolve(path,'index.html');
    }
    const body=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Access-Control-Allow-Origin':'*',...headersFor(url.pathname)});
    res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Serving ${root} at http://127.0.0.1:${port}`));
