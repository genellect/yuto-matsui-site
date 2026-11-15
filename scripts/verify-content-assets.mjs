import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { Script } from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';

// Resolve the actual exported data, including template strings and srcSet values.
// Only the two content modules and their public site configuration can be loaded.
const allowed = new Set(['src/content/ja.ts', 'src/content/en.ts', 'src/site.ts'].map(p => resolve(p)));
const cache = new Map();
function load(path) {
  assert(allowed.has(path), `Unexpected content dependency: ${path}`);
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} };
  cache.set(path, module);
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = specifier => load(resolve(dirname(path), specifier + '.ts'));
  new Script(source, { filename: path }).runInNewContext({ module, exports: module.exports, require }, { timeout: 1000 });
  return module.exports;
}
const paths = new Set(), visited = new WeakSet();
function visit(value) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/\/images\/[^\s,"'`<>]+?\.(?:webp|png|jpe?g|svg|mp4|webm)/g)) paths.add(match[0]);
  } else if (value && typeof value === 'object' && !visited.has(value)) {
    visited.add(value);
    Object.values(value).forEach(visit);
  }
}
for (const language of ['ja', 'en']) visit(load(resolve(`src/content/${language}.ts`)));
for (const path of paths) assert(statSync(resolve('public', '.' + path)).isFile(), `Missing composed content asset: ${path}`);
console.log(`Verified ${paths.size} distinct content asset paths, including template strings and srcSet candidates.`);
