[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ocarsx/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ocarsx/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Cover Studio — GTA 6-style cover art maker

Turn your own photos into a Vice City poster: multi-panel cover art with giant gradient lettering, a neon-sunset grade and full poster furniture — five gold stars and a press quote, a starburst "ORIGINAL COVER ART" stamp, per-panel labels, a Vol. 1 tag, a palm-silhouette ticker band, and credits with a barcode. Everything runs offline in desktop Chrome; your photos never leave your machine.

## How to use

1. Open `app/index.html` (or run `node serve.ts` and open http://localhost:8080).
2. The cover is already finished with the two sample photos — or add up to 4 of your own photos in **1 Photos** and click a thumbnail to place it in the selected panel.
3. Pick a layout, grade and lettering, toggle the poster extras, and drag inside any panel on the cover to reframe its photo (each panel keeps its own crop and zoom, so one photo can fill several panels without looking repeated).
4. Press **Surprise me** for a random cover, **Undo** to step back, then export a PNG in Square 1080 × 1080, Portrait 1080 × 1350 or Wide 1920 × 1080 — or **Export all sizes** in one click.

## Layouts (8)

Key Art (title crashes over the art), Poster (hero left + column right), Diagonal (slanted slices), Strips (vertical strips), Grid 6 (six frames), Triptych (three tall panels), Billboard (wide hero + strip below), Duo (two big panels).

## Grades (6)

Neon Sunset, Vice Pink, Golden Hour, Poster Ink, Teal Noir, Mono Pop — each a canvas colour grade plus tint gradients and a vignette, tuned to keep skin tones natural.

## Lettering (4)

Block Gradient (sunset gradient + heavy outline + shadow), Outline (hollow white), Script (neon script), Slab (chunky serif). Title, script subtitle and ticker tagline are all editable.

## Files

- `app/index.html` — the editor page
- `app/style.css` — dark studio UI
- `app/src/panels.js` — the 8 layouts, 6 grades and 4 lettering styles
- `app/src/render.js` — the cover renderer (panels, grades, lettering, poster furniture, PNG/JPEG export)
- `app/src/editor.js` — editor logic (photos, per-panel crop/zoom, undo, Surprise me, export)
- `app/samples/` — two free-to-use sample photos from the kit
- `main.ts` — hands `app/` and `screenshots/` in with a dossier from `vendor/makefun-app.ts`

A fan-made poster maker. Not affiliated with Rockstar Games; no Rockstar logo, artwork or font is used. Built for the [make.fun bounty "Make GTA 6 Cover Art"](https://make.fun/bounty/gta6-cover-art-01).
