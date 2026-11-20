// Boots the app: loads images, then either runs a fixed screenshot scene
// (?shot=cover or ?shot=editor) or the full editor.
import { defaultState } from './state.js';
import { drawCover } from './render.js';
import { initEditor } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const state = defaultState();

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// The preview canvas is square on the page; the cover itself is drawn at
// the export size when the user saves a PNG.
canvas.width = 1080;
canvas.height = 1080;

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot === 'editor') {
  initEditor(canvas, loadImage);
  runShot(shot, query, canvas, state, loadImage);
} else if (shot) {
  runShot(shot, query, canvas, state, loadImage);
} else {
  drawCover(canvas, state, new Array(6).fill(null));
  initEditor(canvas, loadImage);
}
