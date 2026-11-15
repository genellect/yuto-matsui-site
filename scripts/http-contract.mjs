import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const [mode, origin = 'https://yuto-matsui.com', destination = mode === 'capture' ? 'tests/compare/baseline/http-contract.json' : 'comparison-results/http.json'] = process.argv.slice(2);
if (!['capture', 'check'].includes(mode)) throw new Error('Usage: node scripts/http-contract.mjs capture|check origin [output.json]');
const paths = ['/', '/en/', '/en?x=1', '/robots.txt', '/sitemap.xml', '/1692e67b895d46c0b6124bd047f73fcd.txt'];
const policyHeaders = ['content-type', 'cache-control', 'access-control-allow-origin', 'permissions-policy', 'referrer-policy', 'x-content-type-options', 'link'];
const sha = value => createHash('sha256').update(value).digest('hex');
const expected = mode === 'check' ? JSON.parse(await readFile('tests/compare/baseline/http-contract.json', 'utf8')) : null;
const results = [];
for (const path of paths) {
  const response = await fetch(origin + path, { redirect: 'manual', headers: { 'accept-encoding': 'identity' }, signal: AbortSignal.timeout(30000) });
  const body = Buffer.from(await response.arrayBuffer());
  const headers = Object.fromEntries(response.headers);
  const policy = Object.fromEntries(policyHeaders.map(key => [key, (headers[key] || '').replaceAll(origin, 'https://yuto-matsui.com')]));
  // Header directive ordering has no HTTP meaning; values remain exact.
  policy['cache-control'] = policy['cache-control'].split(',').map(s => s.trim()).sort().join(', ');
  const contract = { status: response.status, location: (headers.location || '').replaceAll(origin, 'https://yuto-matsui.com'), policy };
  if (!['/', '/en/', '/en?x=1'].includes(path)) contract.bodySha256 = sha(body);
  const result = { path, contract, headers };
  if (expected) result.equal = JSON.stringify(contract) === JSON.stringify(expected.results.find(r => r.path === path).contract);
  results.push(result);
  console.log(path, response.status, expected ? (result.equal ? 'equal' : 'DIFFERENT') : 'captured');
}
const report = { observedAt: new Date().toISOString(), sourceCommit: '6bb78ff59837c61fbf3322b7c4a3d43d1b5ab884', origin, method: 'GET; no redirects; identity encoding', policyHeaders, results, passed: results.every(r => r.equal !== false) };
await mkdir(destination.slice(0, destination.lastIndexOf('/')) || '.', { recursive: true });
await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
if (!report.passed) process.exitCode = 1;
