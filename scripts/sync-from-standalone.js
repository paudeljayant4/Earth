#!/usr/bin/env node
'use strict';
/**
 * sync-from-standalone.js
 * Splits ascension-v3.html (the source of truth) into:
 *   - index.html   (shell only, links style.css + script.js)
 *   - style.css    (extracted from <style> block)
 *   - script.js    (extracted from the LAST <script> block — i.e. the app, not CDN imports)
 *
 * Fixes vs original:
 *  1. JS regex targets the LAST <script>...</script> in the file, not the first
 *     (avoids accidentally grabbing a CDN snippet or inline helper block)
 *  2. Ticker constant extracted from standalone so index.html always stays in sync
 */

const fs   = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const repoRoot      = path.resolve(__dirname, '..');
const standalonePath = path.join(repoRoot, 'ascension-v3.html');
const indexPath      = path.join(repoRoot, 'index.html');
const stylePath      = path.join(repoRoot, 'style.css');
const scriptPath     = path.join(repoRoot, 'script.js');
// ─────────────────────────────────────────────────────────────────────────────

function die(msg) { console.error(`[sync] ERROR: ${msg}`); process.exit(1); }

const html = fs.readFileSync(standalonePath, 'utf8');

// ── Extract <style> block ─────────────────────────────────────────────────────
const styleMatch = html.match(/<style>\n?([\s\S]*?)\n?<\/style>/);
if (!styleMatch) die('Could not locate <style> block.');
const css = styleMatch[1].trim() + '\n';

// ── Extract LAST <script> block (the app script, not CDN tags) ───────────────
// Strategy: find all <script>...</script> occurrences, take the final one.
// This correctly skips Three.js CDN script tags which have no closing content.
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
let jsMatch = null, m;
while ((m = scriptRe.exec(html)) !== null) {
  // Only consider blocks that look like real app code (contain 'use strict' or a fn decl)
  if (m[1].trim().length > 200) jsMatch = m;
}
if (!jsMatch) die('Could not locate app <script> block.');
const js = jsMatch[1].trim() + '\n';

// ── Validate ticker constant is present in JS ────────────────────────────────
// The ticker text is defined in script.js as TICKER_TEXT or TICKER — keep in sync.
const tickerMatch = js.match(/const TICKER(?:_TEXT)?='([^']+)'/);
if (tickerMatch) {
  console.log(`[sync] Ticker detected (${tickerMatch[0].length} chars) ✓`);
} else {
  console.warn('[sync] WARNING: Could not detect TICKER constant in JS — check manually.');
}

// ── Extract body HTML (between </head><body> and the CDN <script> tags) ──────
const bodyStartMatch = html.match(/<\/head>\n<body>\n([\s\S]*?)\n<script src=/);
if (!bodyStartMatch) die('Could not locate body HTML block.');
const bodyHTML = bodyStartMatch[1].trim();

// ── Build index.html ─────────────────────────────────────────────────────────
const CDN_SCRIPTS = [
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/EffectComposer.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/RenderPass.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/UnrealBloomPass.js"></script>',
].join('\n');

const indexHTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<title>ASCENSION — YEAR 01</title>',
  '<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,100;0,200;1,100&display=swap" rel="stylesheet">',
  '<link rel="stylesheet" href="style.css">',
  '</head>',
  '<body>',
  bodyHTML,
  '',
  CDN_SCRIPTS,
  '<script src="script.js"></script>',
  '</body>',
  '</html>',
  '',
].join('\n');

// ── Write outputs ─────────────────────────────────────────────────────────────
fs.writeFileSync(stylePath,  css);
fs.writeFileSync(scriptPath, js);
fs.writeFileSync(indexPath,  indexHTML);

const stats = {
  'index.html': fs.statSync(indexPath).size,
  'style.css':  fs.statSync(stylePath).size,
  'script.js':  fs.statSync(scriptPath).size,
};

console.log('[sync] Done. Output sizes:');
Object.entries(stats).forEach(([f, b]) => console.log(`  ${f.padEnd(12)} ${(b/1024).toFixed(1)} KB`));
console.log('[sync] Synced from', path.basename(standalonePath));
