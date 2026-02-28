#!/usr/bin/env node
'use strict';
/**
 * lint-html.js
 * Validates index.html for common structural issues:
 *   - Duplicate IDs
 *   - Missing required elements
 *   - canvas/div elements referenced by script.js
 *   - DO-NOT-EDIT banner presence
 *   - Confirms script.js/style.css are linked
 */

const fs   = require('fs');
const path = require('path');

const repoRoot = __dirname;
const indexPath  = path.join(repoRoot, 'index.html');
const scriptPath = path.join(repoRoot, 'script.js');
const stylePath  = path.join(repoRoot, 'style.css');

const die  = msg => { console.error(`[lint:html] ERROR: ${msg}`); process.exit(1); };
const warn = msg => { console.warn (`[lint:html] WARN:  ${msg}`); warnings++; };
const ok   = msg => { console.log  (`[lint:html]   ✓ ${msg}`); };

let warnings = 0;

if (!fs.existsSync(indexPath))  die('index.html not found — run: node sync-from-standalone.js');
if (!fs.existsSync(scriptPath)) die('script.js not found');
if (!fs.existsSync(stylePath))  die('style.css not found');

const html   = fs.readFileSync(indexPath,  'utf8');
const js     = fs.readFileSync(scriptPath, 'utf8');
const css    = fs.readFileSync(stylePath,  'utf8');

console.log('[lint:html] Checking index.html...');

// ── 1. DO-NOT-EDIT banner ──────────────────────────────────────
if (!html.includes('DO NOT EDIT')) {
  warn('index.html is missing the DO-NOT-EDIT banner — was it edited manually?');
} else ok('DO-NOT-EDIT banner present');

if (!css.includes('DO NOT EDIT')) {
  warn('style.css is missing the DO-NOT-EDIT banner.');
} else ok('style.css DO-NOT-EDIT banner present');

if (!js.includes('DO NOT EDIT')) {
  warn('script.js is missing the DO-NOT-EDIT banner.');
} else ok('script.js DO-NOT-EDIT banner present');

// ── 2. Duplicate IDs ──────────────────────────────────────────
const idRe = /\bid="([^"]+)"/g;
const idMap = {};
let m;
while ((m = idRe.exec(html)) !== null) {
  idMap[m[1]] = (idMap[m[1]] || 0) + 1;
}
const dupes = Object.entries(idMap).filter(([, n]) => n > 1);
if (dupes.length) {
  dupes.forEach(([id, n]) => warn(`Duplicate id="${id}" (${n}×)`));
} else ok('No duplicate IDs');

// ── 3. Required DOM elements (cross-ref with JS usage) ────────
// Scan JS for getElementById calls to build expected set
const jsGetById = new Set();
const gbiRe = /getElementById\(['"]([^'"]+)['"]\)/g;
while ((m = gbiRe.exec(js)) !== null) jsGetById.add(m[1]);

// Skip IDs that are dynamically created in JS (assigned via .id= or createElement)
const dynamicIdRe = /\.id\s*=\s*['"]([^'"]+)['"]/g;
const dynamicIds = new Set();
while ((m = dynamicIdRe.exec(js)) !== null) dynamicIds.add(m[1]);
// Check each expected ID exists in HTML
const htmlIds = new Set(Object.keys(idMap));
let missingCount = 0;
jsGetById.forEach(id => {
  if (dynamicIds.has(id)) return;// created dynamically — OK
  if (!htmlIds.has(id)) {
    warn(`script.js references id="${id}" but it is not present in index.html`);
    missingCount++;
  }
});
if (missingCount === 0) ok(`All ${jsGetById.size} JS-referenced IDs are present in HTML`);

// ── 4. Required assets linked ─────────────────────────────────
if (!html.includes('href="style.css"'))  warn('style.css link not found in index.html');
else ok('style.css linked');

if (!html.includes('src="script.js"'))   warn('script.js link not found in index.html');
else ok('script.js linked');

// ── 5. Three.js CDN present ───────────────────────────────────
if (!html.includes('three.min.js')) warn('Three.js CDN script tag missing');
else ok('Three.js CDN present');

// ── 6. Viewport meta ──────────────────────────────────────────
if (!html.includes('name="viewport"')) warn('Missing viewport meta tag');
else ok('Viewport meta present');

// ── 7. TOTAL consistency ─────────────────────────────────────
const totalJs  = (js.match(/\bTOTAL\s*=\s*(\d+)/) || [null, '??'])[1];
const totalHtm = (html.match(/TOTAL\s*=\s*(\d+)/) || [null, null])[1];
console.log(`[lint:html]   ℹ TOTAL in script.js: ${totalJs}`);
if (totalHtm) console.log(`[lint:html]   ℹ TOTAL in index.html: ${totalHtm}`);

// ── Summary ───────────────────────────────────────────────────
console.log(`\n[lint:html] ${warnings === 0 ? 'PASSED ✓' : `${warnings} warning(s)`}`);
if (warnings > 0) process.exit(1);
