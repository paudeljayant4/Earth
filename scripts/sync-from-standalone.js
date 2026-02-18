#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const standalonePath = path.join(repoRoot, 'ascension-standalone.html');
const indexPath = path.join(repoRoot, 'index.html');
const stylePath = path.join(repoRoot, 'style.css');
const scriptPath = path.join(repoRoot, 'script.js');

const html = fs.readFileSync(standalonePath, 'utf8');

function matchOrThrow(regex, label) {
  const match = html.match(regex);
  if (!match) {
    throw new Error(`Unable to locate ${label} block in ${path.basename(standalonePath)}`);
  }
  return match[1];
}

const css = `${matchOrThrow(/<style>\n?([\s\S]*?)\n?<\/style>/, 'inline style').trim()}\n`;
const js = `${matchOrThrow(/<script>\n?([\s\S]*?)\n?<\/script>\n<\/body>/, 'inline script').trim()}\n`;
const bodyWithDeps = matchOrThrow(/<\/head>\n<body>\n([\s\S]*?)\n<script>\n/, 'body');
const body = bodyWithDeps.replace(/\n<script src=[\s\S]*$/, '').trim();

const head = [
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
  '<body>'
].join('\n');

const footer = [
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/EffectComposer.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/RenderPass.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/postprocessing/UnrealBloomPass.js"></script>',
  '<script src="script.js"></script>',
  '</body>',
  '</html>',
  ''
].join('\n');

fs.writeFileSync(stylePath, css);
fs.writeFileSync(scriptPath, js);
fs.writeFileSync(indexPath, `${head}\n${body}\n\n${footer}`);

console.log('Synced index.html, style.css, and script.js from ascension-standalone.html');
