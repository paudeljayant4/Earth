# ASCENSION — Tooling Guide

## Source of truth

`ascension-standalone.html` is the **single source of truth** for all runtime code.  
Never edit `index.html`, `style.css`, or `script.js` directly — they are generated files.

## Regenerate split files

```bash
node sync-from-standalone.js
```

## Verify sync parity (no-write, exits 1 if drift)

```bash
node sync-from-standalone.js --check
# or:
npm run sync:check
```

## Run all checks

```bash
npm run check
```

This runs:
1. `sync:check` — confirms split files match standalone source
2. `lint:html` — checks for duplicate IDs, missing elements, DO-NOT-EDIT banners

## Install the pre-commit hook

```bash
cp pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

The hook runs `sync:check` and `lint:html` on every `git commit`.

## Use an alternate source file

```bash
node sync-from-standalone.js --src path/to/other.html
```

## Extraction markers

The standalone file uses HTML comments to reliably delimit extractable blocks:

```html
<!-- APP_STYLE_START -->
<style>
  /* your CSS */
</style>
<!-- APP_STYLE_END -->

<!-- APP_SCRIPT_START -->
<script>
  // your JS
</script>
<!-- APP_SCRIPT_END -->
```

Without these markers, the sync script falls back to heuristics (first `<style>`, last large `<script>`) and emits a warning.

## Scene architecture

| Chapter | Scenes | Source constant |
|---------|--------|-----------------|
| I — The Awakening | 1–12 | `TOTAL=36` |
| II — The Reckoning | 13–24 | |
| III — The Signal Beneath | 25–36 | |

## Known issues fixed in this toolchain

| Issue | Fix |
|-------|-----|
| Sync script defaulted to missing `ascension-v3.html` | Changed default to `ascension-standalone.html` |
| `TOTAL=24` in split runtime vs `TOTAL=36` in source | Regenerated from fixed standalone source |
| Duplicate `id="ew2"` and `id="ew3"` | Decorative variants renamed to `ew-sub2`/`ew-sub3` |
| Body extraction cut at first `<script src>` | Full marker + regex approach, order-independent |
| Silent `catch(e){}` | Replaced with `console.warn("[ascension]", e)` |
| Unguarded `getElementById().classList` | Added null guards and optional chaining |
| Full-frame ImageData grain each frame | Tiled 128×128 noise upscaled — ~10× less memory bandwidth |
| No visibilitychange throttling | Loop skips render when tab is hidden |
| No DO-NOT-EDIT banners | All generated files now carry banners |
| No pre-commit enforcement | `pre-commit` hook provided |
