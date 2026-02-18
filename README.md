# Earth

Split-file runtime for the ASCENSION experience.

## Sync workflow

`ascension-standalone.html` is the canonical source for markup, styles, and runtime behavior.

To regenerate `index.html`, `style.css`, and `script.js` from the standalone file, run:

```bash
node scripts/sync-from-standalone.js
```
