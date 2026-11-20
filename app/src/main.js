// Cover Art Studio III — boot. Loads the sample photos, paints the live
// preview, wires the editor, and answers the ?shot= scenes the maker uses to
// photograph the app: ?shot=cover draws one exported cover full-frame,
// ?shot=editor shows the working editor. No network is ever touched.

import { EXPORT_SIZES, SAMPLES, defaultState } from './state.js';
import { drawCover } from './render.js';
import { initEditor } from './editor.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const shotSize = params.get('size') || 'wide';

let state = defaultState();
const images = new Map();
const statusEl = document.getElementById('status');
const preview = document.getElementById('preview');

function status(text) {
  if (statusEl) statusEl.textContent = text;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSamples() {
  const loaded = await Promise.all(SAMPLES.map((s) => loadImage(`./${s.file}`)));
  SAMPLES.forEach((s, i) => {
    if (loaded[i]) images.set(s.id, loaded[i]);
  });
}

function renderPreview() {
  if (!preview) return;
  // The preview canvas paints at half export width: crisp on screen, fast to redraw.
  const size = EXPORT_SIZES.find((s) => s.id === 'wide');
  preview.width = size.w / 2;
  preview.height = size.h / 2;
  drawCover(preview.getContext('2d'), state, images, preview.width, preview.height);
}

async function renderShotCover() {
  const size = EXPORT_SIZES.find((s) => s.id === shotSize) || EXPORT_SIZES[2];
  // The page becomes the cover itself: a canvas at the export size, scaled by CSS.
  document.body.classList.add('shot-cover');
  const canvas = document.createElement('canvas');
  canvas.id = 'shot-canvas';
  canvas.width = size.w;
  canvas.height = size.h;
  document.body.replaceChildren(canvas);
  await loadSamples();
  drawCover(canvas.getContext('2d'), state, images, size.w, size.h);
  document.title = 'READY';
}

async function boot() {
  if (shot === 'cover') {
    await renderShotCover();
    return;
  }
  await loadSamples();
  renderPreview();
  initEditor(document.getElementById('controls'), {
    getState: () => state,
    setState: (next) => { state = next; },
    images,
    renderPreview,
    status,
  });
  status('Six sample photos loaded. Pick a layout, write your words, export a PNG.');
  document.title = 'READY';
}

boot();
