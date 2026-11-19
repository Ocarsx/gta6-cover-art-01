# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ocarsx/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ocarsx/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Cover Studio** turns any photo into a multi-panel poster cover in the spirit of classic open-world game art — no account, no uploads, everything happens locally in the browser.

- **Three poster layouts** — Poster (one hero panel plus a stacked column), Diagonal (four slanted slices) and Strips (vertical strips with a split finale). Panels are leaning polygons divided by thick pale frames over a dark backdrop.
- **Any photo, any panel** — add your own photos (file picker or drag-and-drop), or start from the two bundled samples. Each panel picks its own photo, one photo can fill several panels, and every panel is framed independently with zoom and shift sliders — or by dragging the photo right on the canvas.
- **Neon-sunset grade** — a Vice-City-style colour wash (hot orange through pink into violet) blended over every panel with overlay and soft-light composites, a sun bloom, a warm pool at the foot, plus saturation and contrast lift. One slider drives the whole grade from subtle to full sunset.
- **Bold caption lettering** — an editable heavy condensed title with a neon echo and deep outline, and an editable subtitle riding a gradient colour bar. Lettering auto-fits the cover width.
- **Fast export** — live preview at the exact export size, one click to a posting-ready PNG: 1080×1080 (square), 1080×1350 (portrait) or 1920×1080 (wide).

## Run it

Serve the app locally and open it in a desktop browser:

```
node serve.ts
```

then visit http://localhost:8080 — add photos, pick a layout, frame each panel, set your caption and export.

To hand the entry in (copies `app/` and `screenshots/` to the output directory and writes `dossier.json`):

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---
<sub>Entered on [make.fun](https://make.fun/?ref=s1m1n3px&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
