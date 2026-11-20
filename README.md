# GTA 6 Cover Art Studio III

An offline web app that turns your photos into GTA 6-style cover art: a
six-panel poster grid with a giant chrome-striped title in its own dark band,
a script subtitle, a tagline pill, a five-star press quote, a starburst
stamp, a billing block with a barcode, and a COMING SOON strip with palm
silhouettes — exported as a PNG to share.

## Try it

Serve `app/` with any static server and open `index.html` in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

No network request is made. Your photos are read on your own machine and
never uploaded.

## What it does

- **Six-panel covers** — six roles (The Rider, The Driver, The Fixer, The
  Captain, The Lookout, The Boss), each with its own photo and crop.
- **Six layouts** — Grid (default), Hero, Diagonal, Strips, Duo, Spotlight.
  The title always sits in its own dark band below the photos, so no role
  label is ever covered.
- **Six grades** — Sunset, Neon Nights, Vice Gold, Comic Halftone, Noir,
  Palm Teal.
- **Four letterings** — Chrome Stripes, Neon Glow, Gold Block, Outline Pop.
- **Words** — editable title, subtitle, tagline and press quote, plus toggles
  for the starburst stamp and the billing block + barcode.
- **Any photo** — per-panel crop (zoom, left/right, up/down) with a
  face-safe crop that keeps faces in frame, your own uploads, and one photo
  filling all six panels.
- **Fast** — Surprise me randomises a whole cover, Undo/Redo walk back any
  change, and one click exports a PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080.

## Files

- `app/index.html` — the editor shell.
- `app/style.css` — the editor's dark neon chrome.
- `app/src/state.js` — the cover's state: layouts, grades, letterings, quotes.
- `app/src/render.js` — the cover engine: paints the whole poster on canvas.
- `app/src/editor.js` — the controls, history, Surprise me and exports.
- `app/src/main.js` — boot, sample loading and the `?shot=` screenshot scenes.
- `app/samples/` — six sample photos (made with an image model, free to use).
- `screenshots/` — the cover and the editor, photographed by the app itself.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's `buildDossier`.

## Originality

Everything here is the maker's own: the lettering is drawn by the app in
system fonts, the photos are the kit's free samples or the user's own, and
no Rockstar Games logo, wordmark, official artwork, character or font file
is used anywhere.

## License

MIT — see `LICENSE`.
