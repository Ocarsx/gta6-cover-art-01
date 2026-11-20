# GTA 6 Cover Art Studio III

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ocarsx/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ocarsx/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline cover maker that turns your photos into GTA-style poster art:
six different people in framed panels, one big hero close-up in the middle,
a chrome striped title, and the full poster furniture — quote band, billing
block, barcode, starburst stamp, and a COMING SOON band with palm trees.

## How to use

1. Serve the app and open it in a desktop browser:
   ```sh
   node serve.ts
   # open http://localhost:8080
   ```
   No network needed — everything runs from local files.
2. The default cover is ready: six cast photos, a hero close-up in the
   centre, and the title **SUNSET HEIST**. Pick a panel to change its photo,
   nudge its focal point, or zoom it; every face stays whole, the crop
   follows the face instead of cutting it.
3. Try the 8 layouts, 7 colour grades (including the comic-style
   **Poster Ink**), and 4 lettering styles. **Surprise me** shuffles a fresh
   cover; **Undo** / **Redo** step back and forward.
4. Load your own photo into any panel, or use one photo for all panels.
5. Export a PNG in **1080 × 1080**, **1080 × 1350**, or **1920 × 1080**.

## What is inside

- `app/index.html` — the editor page.
- `app/style.css` — the editor's look.
- `app/src/state.js` — the cast, the 8 layouts, the 7 grades, the 4
  lettering styles, and the default cover.
- `app/src/render.js` — draws the cover: face-safe panel crops, the chrome
  striped title, and all the poster furniture.
- `app/src/editor.js` — the controls, undo history, Surprise me, uploads,
  and PNG exports.
- `app/src/shots.js` — the fixed scenes the screenshots were taken from.
- `app/src/main.js` — boots the editor or a screenshot scene.
- `app/samples/` — the sample photos (two from the kit, four cast portraits
  made for this entry).
- `screenshots/` — the cover and the editor, taken from the app itself.
- `main.ts` — hands the app and screenshots to the grader.

## Notes

- The sample photos are free to use (the kit's two, plus portraits made for
  this entry). No Rockstar logo, artwork, or font is used anywhere.
- The cover's furniture quotes a fictional film — Golden Mile Pictures,
  Palm & Pistol, R. Valentine — invented for the poster, not a real studio.

Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on make.fun.

<sub>Entered on [make.fun](https://make.fun/?ref=s1m1n3px&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
