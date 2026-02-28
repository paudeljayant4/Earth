#!/usr/bin/env node
'use strict';
/**
 * sync-from-standalone.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth: ascension-standalone.html
 * Generates: index.html · style.css · script.js
 *
 * Usage:
 *   node scripts/sync-from-standalone.js           # regenerate
 *   node scripts/sync-from-standalone.js --check   # diff-only (exit 1 on drift)
 *   node scripts/sync-from-standalone.js --src <f> # alternate source
 *
 * Extraction strategy (in priority order):
 *   1. Explicit markers  <!-- APP_STYLE_START/END --> and <!-- APP_SCRIPT_START/END -->
 *   2. Heuristic fallback with a loud warning so you know to add markers
 *
 * Generated files carry DO-NOT-EDIT banners; a pre-commit hook can
 * enforce sync parity by running with --check.
 * ─────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

// ── CLI flags ─────────────────────────────────────────────────
const args      = process.argv.slice(2);
const srcFlag   = args.indexOf('--src');
const checkMode = args.includes('--check');

const repoRoot = __dirname;// sync script lives in repo root

// FIX: default to ascension-standalone.html, not ascension-v3.html
const standalonePath = (srcFlag !== -1 && args[srcFlag + 1])
  ? path.resolve(args[srcFlag + 1])
  : path.join(repoRoot, 'ascension-standalone.html');

const OUT = {
  index:  path.join(repoRoot, 'index.html'),
  style:  path.join(repoRoot, 'style.css'),
  script: path.join(repoRoot, 'script.js'),
};

const CDN_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/three@0.128/build/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/shaders/CopyShader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/shaders/LuminosityHighPassShader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/EffectComposer.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/RenderPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/UnrealBloomPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/ShaderPass.js',
];

// ── Logging ───────────────────────────────────────────────────
const die  = msg => { console.error(`[sync] ERROR: ${msg}`); process.exit(1); };
const warn = msg => { console.warn (`[sync] WARN:  ${msg}`); };
const ok   = msg => { console.log  (`[sync]   ✓ ${msg}`); };
const info = msg => { console.log  (`[sync] ${msg}`); };

// ── Load source ───────────────────────────────────────────────
if (!fs.existsSync(standalonePath)) {
  die(`Source not found: ${standalonePath}\n       ` +
      `Use --src <file> to specify a different source or place ` +
      `ascension-standalone.html in the repo root.`);
}
const html = fs.readFileSync(standalonePath, 'utf8');
info(`Source: ${path.basename(standalonePath)} (${(html.length / 1024).toFixed(1)} KB)`);

// ── Extract CSS ───────────────────────────────────────────────
let css;
const cssStart = html.indexOf('<!-- APP_STYLE_START -->');
const cssEnd   = html.indexOf('<!-- APP_STYLE_END -->');
if (cssStart !== -1 && cssEnd > cssStart) {
  // Strip the surrounding <style> tags too if present
  css = html.slice(cssStart + '<!-- APP_STYLE_START -->'.length, cssEnd)
            .replace(/^\s*<style>\s*/, '')
            .replace(/\s*<\/style>\s*$/, '')
            .trim();
} else {
  warn('APP_STYLE markers not found — falling back to first <style> block. ' +
       'Add <!-- APP_STYLE_START --> / <!-- APP_STYLE_END --> around your <style> for reliability.');
  const m = html.match(/<style>\n?([\s\S]*?)\n?<\/style>/);
  if (!m) die('No <style> block found in source.');
  css = m[1].trim();
}
css += '\n';
info(`CSS: ${css.split('\n').length} lines`);

// ── Extract JS ────────────────────────────────────────────────
let js;
const jsStart = html.indexOf('<!-- APP_SCRIPT_START -->');
const jsEnd   = html.indexOf('<!-- APP_SCRIPT_END -->');
if (jsStart !== -1 && jsEnd > jsStart) {
  js = html.slice(jsStart + '<!-- APP_SCRIPT_START -->'.length, jsEnd)
           .replace(/^\s*<script>\s*/, '')
           .replace(/\s*<\/script>\s*$/, '')
           .trim();
} else {
  warn('APP_SCRIPT markers not found — falling back to last substantial inline <script>. ' +
       'Add <!-- APP_SCRIPT_START --> / <!-- APP_SCRIPT_END --> around your <script> for reliability.');
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m, best = null;
  while ((m = re.exec(html)) !== null) {
    if (m[1].trim().length > 200) best = m;
  }
  if (!best) die('No substantial inline <script> block found.');
  js = best[1].trim();
}
js += '\n';
info(`JS:  ${js.split('\n').length} lines (${(js.length / 1024).toFixed(1)} KB)`);

if (js.length < 5000) warn('JS is suspiciously small — verify source file integrity.');

// ── Validate expected tokens ──────────────────────────────────
const TOTAL_m = js.match(/\bTOTAL\s*=\s*(\d+)/);
const TOTAL_v = TOTAL_m ? TOTAL_m[1] : '??';
info(`Validating JS (TOTAL=${TOTAL_v}):`);

const REQUIRED_TOKENS = [
  ['TOTAL=',      `scene count (TOTAL=${TOTAL_v})`],
  ['runPart2',    'Part 2 function'],
  ['atmMat',      'atmosphere shader'],
  ['moonPivot',   'moon object'],
  ['playP2Audio', 'Part 2 audio'],
  ['TICKER_P2',   'Part 2 ticker'],
];
let tokenFail = false;
REQUIRED_TOKENS.forEach(([tok, label]) => {
  if (!js.includes(tok)) { warn(`Missing token: ${tok} (${label})`); tokenFail = true; }
  else ok(label);
});
if (tokenFail) warn('Some expected tokens are missing — standalone source may be incomplete.');
if (parseInt(TOTAL_v) < 24) warn(`TOTAL=${TOTAL_v} is unexpectedly low; expected ≥24 for full 3-chapter timeline.`);

// ── Extract body HTML (robust: no CDN-script position dependency) ──
const bodyOpen  = html.indexOf('<body>');
const bodyClose = html.lastIndexOf('</body>');
if (bodyOpen === -1 || bodyClose === -1) die('Could not locate <body>...</body> in source.');

let bodyHTML = html.slice(bodyOpen + 6, bodyClose);

// Remove CDN script tags (order-independent regex, not position-based cut)
const cdnEscaped = CDN_SCRIPTS.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
cdnEscaped.forEach(esc => {
  bodyHTML = bodyHTML.replace(new RegExp(`<script src="${esc}"[^>]*>\\s*</script>\\s*`, 'g'), '');
});

// Remove APP_SCRIPT_START/END wrapped block (includes its <script> tags)
bodyHTML = bodyHTML.replace(/<!--\s*APP_SCRIPT_START\s*-->[\s\S]*?<!--\s*APP_SCRIPT_END\s*-->\s*/g, '');

// Remove APP_STYLE_START/END wrapped block
bodyHTML = bodyHTML.replace(/<!--\s*APP_STYLE_START\s*-->[\s\S]*?<!--\s*APP_STYLE_END\s*-->\s*/g, '');

// Remove any remaining large inline <script> blocks (app code not caught by markers)
bodyHTML = bodyHTML.replace(/<script>([\s\S]*?)<\/script>/g, (match, inner) =>
  inner.trim().length > 200 ? '' : match);

// Remove any remaining <style> blocks
bodyHTML = bodyHTML.replace(/<style>[\s\S]*?<\/style>/g, '');

bodyHTML = bodyHTML.trim();

// ── Duplicate-ID check ────────────────────────────────────────
const idRe = /\bid="([^"]+)"/g;
const idCount = {};
let idMatch;
while ((idMatch = idRe.exec(bodyHTML)) !== null) {
  idCount[idMatch[1]] = (idCount[idMatch[1]] || 0) + 1;
}
const dupeIDs = Object.entries(idCount).filter(([, n]) => n > 1);
if (dupeIDs.length) {
  dupeIDs.forEach(([id, n]) =>
    warn(`Duplicate id="${id}" appears ${n}× in body — fix in standalone source.`));
} else {
  ok('No duplicate IDs in extracted body');
}

// ── Title ─────────────────────────────────────────────────────
const titleM = html.match(/<title>([^<]+)<\/title>/);
const title  = titleM ? titleM[1] : 'ASCENSION';

// ── Banners ───────────────────────────────────────────────────
const ts  = new Date().toISOString();
const src = path.basename(standalonePath);

const BANNER_JS = [
  '/*',
  ` * !! DO NOT EDIT THIS FILE DIRECTLY !!`,
  ` * Auto-generated from: ${src}`,
  ` * Regenerate: node scripts/sync-from-standalone.js`,
  ` * Generated:  ${ts}`,
  ' */',
  '',
].join('\n');

const BANNER_CSS = [
  `/* DO NOT EDIT — auto-generated from ${src}`,
  ` * Regenerate: node scripts/sync-from-standalone.js */`,
  '',
].join('\n');

const BANNER_HTML = `<!-- DO NOT EDIT — auto-generated from ${src} | Regenerate: node scripts/sync-from-standalone.js -->\n`;

// ── Build index.html ──────────────────────────────────────────
const cdnTags = CDN_SCRIPTS.map(u => `<script src="${u}"></script>`).join('\n');

const indexHTML = [
  '<!DOCTYPE html>',
  BANNER_HTML.trim(),
  '<html lang="en">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  `<title>${title}</title>`,
  '<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,100;0,200;1,100&display=swap" rel="stylesheet">',
  '<link rel="stylesheet" href="style.css">',
  '</head>',
  '<body>',
  bodyHTML,
  '',
  cdnTags,
  '<script src="script.js"></script>',
  '</body>',
  '</html>',
  '',
].join('\n');

const OUT_CSS    = BANNER_CSS  + css;
const OUT_JS     = BANNER_JS   + js;
const OUT_INDEX  = indexHTML;

// ── Check mode (exit 1 on drift, no writes) ───────────────────
if (checkMode) {
  // Strip datestamp from banner before comparing
  const normalize = s => s
    .replace(/Generated:\s+[\d\-T:.Z]+\n/, '')
    .replace(/auto-generated from [^\n]+\n/g, '')
    .replace(/DO NOT EDIT[^\n]*\n/g, '')
    .trim();

  let drifted = false;
  [
    [OUT.index, OUT_INDEX, 'index.html'],
    [OUT.style, OUT_CSS,   'style.css'],
    [OUT.script, OUT_JS,   'script.js'],
  ].forEach(([fp, generated, label]) => {
    if (!fs.existsSync(fp)) {
      warn(`${label} does not exist — run sync to generate.`);
      drifted = true;
      return;
    }
    const existing = normalize(fs.readFileSync(fp, 'utf8'));
    const fresh    = normalize(generated);
    if (existing !== fresh) {
      console.error(`[sync:check] DRIFT DETECTED: ${label} differs from sync output.`);
      // Show first diff line for quick diagnosis
      const eL = existing.split('\n');
      const fL = fresh.split('\n');
      for (let i = 0; i < Math.min(eL.length, fL.length); i++) {
        if (eL[i] !== fL[i]) {
          console.error(`  First diff at line ~${i + 1}:`);
          console.error(`  - ${eL[i].slice(0, 100)}`);
          console.error(`  + ${fL[i].slice(0, 100)}`);
          break;
        }
      }
      drifted = true;
    } else {
      ok(`${label} is in sync`);
    }
  });

  if (drifted) {
    console.error('[sync:check] Fix: node scripts/sync-from-standalone.js');
    process.exit(1);
  }
  info('All outputs in sync ✓');
  process.exit(0);
}

// ── Write outputs ─────────────────────────────────────────────
fs.writeFileSync(OUT.style,  OUT_CSS);
fs.writeFileSync(OUT.script, OUT_JS);
fs.writeFileSync(OUT.index,  OUT_INDEX);

info('Output:');
Object.entries(OUT).forEach(([label, fp]) => {
  const name = path.basename(fp);
  info(`  ${name.padEnd(14)} ${(fs.statSync(fp).size / 1024).toFixed(1)} KB`);
});
info('Done ✓');
