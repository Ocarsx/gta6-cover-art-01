// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the
// size the `size` query asks for; ?shot=editor shows the full editor with
// the default cast loaded. window.__shotReady is set once painted.
import { CAST } from './state.js';
import { drawCover } from './render.js';

const SIZES = {
  landscape: { w: 1280, h: 720 },
  square: { w: 1080, h: 1080 },
  portrait: { w: 1024, h: 1280 },
};

export async function runShot(shot, query, canvas, state, loadImage) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = SIZES[query.get('size')] ?? SIZES.landscape;
    canvas.width = size.w;
    canvas.height = size.h;
    const photos = await Promise.all(
      state.panels.map((p) => loadImage(CAST[p.cast].file)),
    );
    drawCover(canvas, state, photos);
  } else {
    // Editor scene: the editor boots itself; just wait for its first paint.
    await new Promise((resolve) => {
      const tick = () => (window.__shotReady ? resolve() : setTimeout(tick, 50));
      tick();
    });
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
