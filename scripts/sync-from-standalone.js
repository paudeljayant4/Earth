#!/usr/bin/env node
'use strict';
/**
 * sync-from-standalone.js
 * ─────────────────────────────────────────────────────────────
 * Splits ascension-v3.html (the one-file source of truth) into:
 *
 *   index.html   — shell HTML linking style.css + script.js
 *   style.css    — all CSS extracted from <style> block
 *   script.js    — the app JS extracted from the LAST <script> block
 *
 * Usage:
 *   node scripts/sync-from-standalone.js
 *   node scripts/sync-from-standalone.js --src path/to/file.html
 *
 * Fixes vs original:
 *   1. Grabs the LAST <script>...</script> block (avoids CDN inline tags)
 *   2. Validates JS size (warns if suspiciously small)
 *   3. Live Kp / ticker content auto-detected and reported
 *   4. Supports --src flag for alternate source file
 * ─────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const srcFlag    = args.indexOf('--src');
const repoRoot   = path.resolve(__dirname, '..');

const standalonePath = srcFlag !== -1 && args[srcFlag+1]
  ? path.resolve(args[srcFlag+1])
  : path.join(repoRoot, 'ascension-v3.html');

const indexPath  = path.join(repoRoot, 'index.html');
const stylePath  = path.join(repoRoot, 'style.css');
const scriptPath = path.join(repoRoot, 'script.js');

const CDN_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/EffectComposer.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/RenderPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/UnrealBloomPass.js',
];
// ─────────────────────────────────────────────────────────────

function die(msg) { console.error('[sync] ERROR: ' + msg); process.exit(1); }
function warn(msg){ console.warn('[sync] WARN: ' + msg); }

if (!fs.existsSync(standalonePath)) die('Source not found: ' + standalonePath);

const html = fs.readFileSync(standalonePath, 'utf8');
console.log('[sync] Source: ' + path.basename(standalonePath) + ' (' + (html.length / 1024).toFixed(1) + ' KB)');

// ── Extract <style> block ────────────────────────────────────
const styleMatch = html.match(/<style>\n?([\s\S]*?)\n?<\/style>/);
if (!styleMatch) die('Could not locate <style> block.');
const css = styleMatch[1].trim() + '\n';
console.log('[sync] CSS: ' + css.split('\n').length + ' lines');

// ── Extract LAST app <script> block ─────────────────────────
// Strategy: collect all <script>...</script> blocks, take the last
// substantial one (>200 chars), which is always the app — not CDN snippets.
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
let jsMatch = null, m;
while ((m = scriptRe.exec(html)) !== null) {
  if (m[1].trim().length > 200) jsMatch = m;
}
if (!jsMatch) die('Could not locate app <script> block.');
const js = jsMatch[1].trim() + '\n';
console.log('[sync] JS: ' + js.split('\n').length + ' lines (' + (js.length/1024).toFixed(1) + ' KB)');
if (js.length < 10000) warn('JS seems unusually small — verify source file.');

// ── Validate key identifiers ─────────────────────────────────
const checks = [
  ['TOTAL=', 'scene count constant'],
  ['runPart2', 'Part 2 function'],
  ['atmMat', 'atmosphere shader'],
  ['moonPivot', 'moon object'],
  ['playP2Audio', 'Part 2 audio'],
  ['TICKER_P2', 'Part 2 ticker'],
];
checks.forEach(([token, label]) => {
  if (!js.includes(token)) warn('Expected token not found in JS: ' + token + ' (' + label + ')');
  else console.log('[sync]   ✓ ' + label);
});

// ── Extract body HTML ────────────────────────────────────────
const bodyStart = html.match(/<body>\n?/);
const bodyEnd   = html.match(/<script src="https:\/\//);
if (!bodyStart || !bodyEnd) die('Cannot locate body boundaries.');
const bodyHTML = html.slice(
  html.indexOf('<body>') + 6,
  html.indexOf('<script src="https://')
).trim();

// ── Build index.html ─────────────────────────────────────────
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
const title = titleMatch ? titleMatch[1] : 'ASCENSION';

const cdnTags = CDN_SCRIPTS.map(u => '<script src="' + u + '"></script>').join('\n');

const indexHTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<title>' + title + '</title>',
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

// ── Write outputs ─────────────────────────────────────────────
fs.writeFileSync(stylePath,  css);
fs.writeFileSync(scriptPath, js);
fs.writeFileSync(indexPath,  indexHTML);

const sizes = {
  'index.html': fs.statSync(indexPath).size,
  'style.css':  fs.statSync(stylePath).size,
  'script.js':  fs.statSync(scriptPath).size,
};
console.log('[sync] Output:');
Object.entries(sizes).forEach(([f, b]) =>
  console.log('  ' + f.padEnd(14) + (b / 1024).toFixed(1) + ' KB'));
console.log('[sync] Done. ✓');
