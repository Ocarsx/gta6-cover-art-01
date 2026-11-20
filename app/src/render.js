// Draws the whole cover onto a canvas: photo panels, chrome title, and all
// the poster furniture. Every size is a fraction of the canvas, so the same
// code renders the square, portrait and landscape exports.
import { CAST, GRADES, LAYOUTS, LETTERINGS } from './state.js';

const DISPLAY = '"Arial Black", "Liberation Sans", "DejaVu Sans", sans-serif';
const BODY = '"Liberation Sans", "DejaVu Sans", sans-serif';

function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

function letteringById(id) {
  return LETTERINGS.find((l) => l.id === id) ?? LETTERINGS[0];
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function star(ctx, cx, cy, r, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function starburst(ctx, cx, cy, rOuter, rInner, spikes = 20) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One palm tree silhouette: a leaning trunk and a crown of drooping fronds.
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.3, y - s * 0.95);
  ctx.stroke();
  const topX = x + s * 0.3;
  const topY = y - s * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13);
    const ex = topX + Math.cos(a) * s * 0.62;
    const ey = topY + Math.sin(a) * s * 0.42 + s * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * s * 0.35, topY - s * 0.12,
      ex, ey,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Draws one photo into a panel rect, keeping the whole face visible.
// The face box (from the cast member) must end up inside the crop: the zoom
// is capped so the box fits, and when the panel is too wide for a full-bleed
// crop the photo is fitted over a blurred copy of itself instead.
function drawPanel(ctx, img, panel, rect, grade, comic) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (!img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3a1c5e');
    g.addColorStop(1, '#160a24');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${Math.max(12, h * 0.09)}px ${BODY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const member = CAST[panel.cast] ?? CAST[0];
  const fh = member.fh;
  const faceW = 0.62 * iw; // face box width, in photo pixels
  const faceH = 2 * fh * ih; // face box height, in photo pixels
  const coverScale = Math.max(w / iw, h / ih);
  const wantScale = coverScale * (panel.zoom || 1);
  // Largest scale that still shows the whole face box with a small margin.
  const faceScale = Math.min(w / (faceW * 1.1), h / (faceH * 1.1));
  const scale = Math.min(wantScale, faceScale);
  const focalX = (panel.fx ?? member.fx) * iw;
  const focalY = (panel.fy ?? member.fy) * ih;

  if (scale >= coverScale * 0.999) {
    // Full-bleed crop centred on the face.
    const sw = w / scale;
    const sh = h / scale;
    let sx = focalX - sw / 2;
    let sy = focalY - sh / 2;
    sx = Math.max(0, Math.min(iw - sw, sx));
    sy = Math.max(0, Math.min(ih - sh, sy));
    ctx.filter = grade.filter;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.filter = 'none';
  } else {
    // Too wide a panel for a full-bleed face: blurred backdrop, fitted photo.
    ctx.filter = 'blur(16px) brightness(0.5) saturate(1.3)';
    const bs = coverScale;
    const bw = iw * bs;
    const bh = ih * bs;
    ctx.drawImage(img, x + (w - bw) / 2, y + (h - bh) / 2, bw, bh);
    ctx.filter = grade.filter;
    const dw = iw * scale;
    const dh = ih * scale;
    let dx = x + w / 2 - focalX * scale;
    let dy = y + h / 2 - focalY * scale;
    // Keep the fitted photo inside the panel. When it is larger than the
    // panel it must cover it ([x+w-dw, x]); when it is smaller it fits
    // whole, so the focal point stays centred ([x, x+w-dw]) instead of the
    // photo being pinned to the panel's right/bottom edge.
    const loX = Math.min(x, x + w - dw);
    const hiX = Math.max(x, x + w - dw);
    dx = Math.min(hiX, Math.max(loX, dx));
    const loY = Math.min(y, y + h - dh);
    const hiY = Math.max(y, y + h - dh);
    dy = Math.min(hiY, Math.max(loY, dy));
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  }

  // Grade wash, then the comic treatment's halftone dots if asked.
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = grade.shade;
  ctx.fillRect(x, y, w, h);
  if (comic) {
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#000000';
    const step = Math.max(7, w * 0.018);
    for (let py = y + step / 2; py < y + h; py += step) {
      for (let px = x + step / 2; px < x + w; px += step) {
        ctx.beginPath();
        ctx.arc(px, py, step * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();

  // Frame + name tag, drawn outside the clip.
  ctx.save();
  ctx.strokeStyle = comic ? '#12081f' : 'rgba(255, 214, 120, 0.85)';
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  const label = (panel.label || '').trim();
  if (label) {
    const pad = h * 0.045;
    const tagH = h * 0.115;
    const tx = x + w * 0.03;
    const ty = y + h - tagH - h * 0.05;
    // Shrink the tag text until the whole tag fits inside its panel.
    let tagSize = Math.max(11, h * 0.085);
    let tw = 0;
    for (;;) {
      ctx.font = `900 ${tagSize}px ${DISPLAY}`;
      tw = ctx.measureText(label).width;
      if (tx + pad * 0.9 + tw + pad * 3.2 <= x + w - 4 || tagSize <= 11) break;
      tagSize -= 1;
    }
    const tagW = tw + pad * 3.2;
    ctx.fillStyle = 'rgba(10, 4, 20, 0.88)';
    rr(ctx, tx + pad * 0.9, ty, tagW, tagH, tagH * 0.22);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    const slashW = pad * 0.55;
    ctx.moveTo(tx, ty + tagH);
    ctx.lineTo(tx + slashW, ty);
    ctx.lineTo(tx + slashW * 2, ty);
    ctx.lineTo(tx + slashW, ty + tagH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, tx + pad * 2.1, ty + tagH / 2 + 1);
  }
  ctx.restore();
}

// Picks the biggest title size that still fits the band, by measuring.
function titleSize(text, font, maxW) {
  let size = 200;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font(size);
  while (probe.measureText(text).width > maxW && size > 24) {
    size -= 4;
    probe.font = font(size);
  }
  return size;
}

// Paints the big title straight onto the cover: a drop shadow, a thick
// outline, then the letters filled with a gradient. The chrome gradient
// carries hard stops, so dark bands cut across the letters like brushed
// metal — no offscreen masks, what is drawn is what you get.
function drawTitle(ctx, state, cx, cy, maxW, H) {
  const text = (state.title || 'SUNSET HEIST').toUpperCase();
  const style = letteringById(state.lettering);
  const font = (size) => `900 ${size}px ${DISPLAY}`;
  const size = titleSize(text, font, maxW);
  const top = cy - size * 0.62;
  const bottom = cy + size * 0.62;

  ctx.save();
  ctx.font = font(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  // Drop shadow: the words once, near-black, shifted down.
  ctx.fillStyle = 'rgba(5, 0, 12, 0.9)';
  ctx.fillText(text, cx, cy + size * 0.07);

  // Thick outline behind the fill, in the style's dark tone. The outline
  // style pops its pink stroke offset down-right instead.
  const ox = style.id === 'outline' ? size * 0.05 : 0;
  const oy = style.id === 'outline' ? size * 0.06 : 0;
  let outline = '#3d0a5e';
  if (style.id === 'neon') outline = '#2b0a4a';
  else if (style.id === 'gold') outline = '#4a2400';
  else if (style.id === 'outline') outline = '#ff2e88';
  // Thin outline: a crisp keyline around the letters. The old 0.30 weight
  // made neighbouring letters' halos merge into one solid purple blob that
  // swallowed the fill.
  ctx.lineWidth = size * 0.12;
  ctx.strokeStyle = outline;
  ctx.strokeText(text, cx + ox, cy + oy);

  // The fill gradient for this lettering style.
  let grad = null;
  if (style.id === 'chrome') {
    grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0.0, '#ffffff');
    grad.addColorStop(0.22, '#ffe9a8');
    grad.addColorStop(0.30, '#ffb03c');
    grad.addColorStop(0.31, '#3d0a5e');
    grad.addColorStop(0.39, '#3d0a5e');
    grad.addColorStop(0.40, '#ff5e7a');
    grad.addColorStop(0.55, '#ff2e88');
    grad.addColorStop(0.63, '#3d0a5e');
    grad.addColorStop(0.71, '#3d0a5e');
    grad.addColorStop(0.72, '#d67dff');
    grad.addColorStop(0.88, '#b678ff');
    grad.addColorStop(1.0, '#e3b8ff');
  } else if (style.id === 'neon') {
    grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, '#fff3fa');
    grad.addColorStop(0.45, '#ff7ad9');
    grad.addColorStop(1, '#c44dff');
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.35;
  } else if (style.id === 'gold') {
    grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, '#fffbe0');
    grad.addColorStop(0.35, '#ffe27a');
    grad.addColorStop(0.6, '#f5a623');
    grad.addColorStop(0.8, '#b96a00');
    grad.addColorStop(1, '#ffe9a8');
  }

  if (grad) {
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
  }
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  const rand = mulberry32(10472);
  let bx = x + w * 0.06;
  const top = y + h * 0.10;
  const bottom = y + h * 0.72;
  ctx.fillStyle = '#111111';
  while (bx < x + w * 0.94) {
    const bw = 1 + rand() * (w * 0.028);
    const gap = 1 + rand() * (w * 0.02);
    if (rand() > 0.35) ctx.fillRect(bx, top, bw, bottom - top);
    bx += bw + gap;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `400 ${Math.max(9, h * 0.13)}px ${BODY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0 10472 05991 8', x + w / 2, y + h * 0.86);
  ctx.restore();
}

export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const comic = !!grade.comic;

  // Backdrop: deep plum, darker toward the edges.
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.1, W / 2, H * 0.5, W * 0.72);
  bg.addColorStop(0, '#2a1245');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Quote band.
  const qy = H * 0.035;
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd76a';
  const starR = H * 0.013;
  let sx = W * 0.022;
  for (let i = 0; i < 5; i++) {
    star(ctx, sx, qy, starR);
    ctx.fill();
    sx += starR * 2.5;
  }
  // Fit the quote + source between the stars and the VOL. 1 badge.
  ctx.font = `900 ${H * 0.020}px ${DISPLAY}`;
  const volW = ctx.measureText('VOL. 1').width + H * 0.03;
  const quoteText = `\u201C${state.quote || ''}\u201D`;
  const sourceText = `\u2014 ${state.quoteSource || ''}`;
  const quoteX = sx + W * 0.008;
  const availQ = W * 0.978 - volW - W * 0.012 - quoteX;
  let qSize = H * 0.020;
  let qw = 0;
  let sw = 0;
  for (;;) {
    ctx.font = `900 ${qSize}px ${DISPLAY}`;
    qw = ctx.measureText(quoteText).width;
    ctx.font = `700 ${qSize * 0.8}px ${BODY}`;
    sw = ctx.measureText(sourceText).width;
    if (qw + W * 0.012 + sw <= availQ || qSize <= 8) break;
    qSize -= 1;
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${qSize}px ${DISPLAY}`;
  ctx.fillText(quoteText, quoteX, qy);
  ctx.fillStyle = '#ffb03c';
  ctx.font = `700 ${qSize * 0.8}px ${BODY}`;
  ctx.fillText(sourceText, quoteX + qw + W * 0.012, qy + 1);
  // VOL. 1 badge.
  ctx.font = `900 ${H * 0.020}px ${DISPLAY}`;
  const volText = 'VOL. 1';
  const vw = ctx.measureText(volText).width + H * 0.03;
  const vh = H * 0.034;
  ctx.fillStyle = '#ffd76a';
  rr(ctx, W * 0.978 - vw, qy - vh / 2, vw, vh, vh * 0.25);
  ctx.fill();
  ctx.fillStyle = '#1c0b2e';
  ctx.textAlign = 'center';
  ctx.fillText(volText, W * 0.978 - vw / 2, qy + 1);
  ctx.restore();

  // Photo zone.
  const zx = W * 0.012;
  const zy = H * 0.062;
  const zw = W * 0.976;
  const zh = H * 0.598;
  const slantDx = (layout.slant || 0) * zw;
  layout.slots.forEach((slot, i) => {
    const panel = state.panels[layout.order[i]] ?? state.panels[0];
    const rect = {
      x: zx + slot.x * zw,
      y: zy + slot.y * zh,
      w: slot.w * zw,
      h: slot.h * zh,
    };
    if (slantDx) {
      // Slanted panels: clip each one into a parallelogram.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rect.x + slantDx, rect.y);
      ctx.lineTo(rect.x + rect.w + slantDx, rect.y);
      ctx.lineTo(rect.x + rect.w - slantDx, rect.y + rect.h);
      ctx.lineTo(rect.x - slantDx, rect.y + rect.h);
      ctx.closePath();
      ctx.clip();
      drawPanel(ctx, photos[layout.order[i]] ?? null, panel, rect, grade, comic);
      ctx.restore();
    } else {
      drawPanel(ctx, photos[layout.order[i]] ?? null, panel, rect, grade, comic);
    }
  });

  // Title band: dark scrim, then the chrome title, script subtitle, pill.
  const ty0 = H * 0.66;
  const tg = ctx.createLinearGradient(0, ty0, 0, H * 0.85);
  tg.addColorStop(0, '#1c0b2e');
  tg.addColorStop(1, '#12081f');
  ctx.fillStyle = tg;
  ctx.fillRect(0, ty0, W, H * 0.185);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, ty0, W, Math.max(2, H * 0.003));

  drawTitle(ctx, state, W / 2, H * 0.735, W * 0.86, H);

  // Script subtitle.
  ctx.save();
  ctx.font = `italic 700 ${H * 0.038}px Georgia, "Liberation Serif", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.7)';
  ctx.shadowBlur = H * 0.012;
  ctx.fillStyle = '#ff9ed2';
  ctx.fillText(state.subtitle || '', W / 2, H * 0.795);
  ctx.restore();

  // Tagline pill.
  ctx.save();
  ctx.font = `700 ${H * 0.017}px ${BODY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(2, H * 0.004)}px`;
  const tag = (state.tagline || '').toUpperCase();
  const tagW = ctx.measureText(tag).width + H * 0.05;
  const tagH = H * 0.032;
  const tagX = W / 2 - tagW / 2;
  const tagY = H * 0.815;
  ctx.fillStyle = '#2a1245';
  rr(ctx, tagX, tagY, tagW, tagH, tagH / 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = Math.max(1.5, H * 0.0016);
  rr(ctx, tagX, tagY, tagW, tagH, tagH / 2);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, W / 2, tagY + tagH / 2 + 1);
  ctx.restore();

  // Starburst stamp: lives in the title band's right side, clear of faces.
  const stampR = W * 0.042;
  const stampX = W * 0.945;
  const stampY = H * 0.725;
  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate(-0.18);
  starburst(ctx, 0, 0, stampR, stampR * 0.86);
  ctx.fillStyle = '#ffc21c';
  ctx.fill();
  ctx.strokeStyle = '#7a4a00';
  ctx.lineWidth = Math.max(1.5, stampR * 0.04);
  ctx.stroke();
  ctx.fillStyle = '#4a2400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${stampR * 0.26}px ${DISPLAY}`;
  ctx.fillText('ORIGINAL', 0, -stampR * 0.28);
  ctx.fillText('COVER ART', 0, stampR * 0.02);
  star(ctx, 0, stampR * 0.42, stampR * 0.09);
  ctx.fill();
  ctx.restore();

  // Billing block, two lines, centred.
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bill1 = 'A GOLDEN MILE PICTURES PRODUCTION  \u00B7  IN ASSOCIATION WITH PALM & PISTOL  \u00B7  A R. VALENTINE FILM';
  const bill2 = 'SUNSET HEIST  \u00B7  MUSIC BY THE NIGHT SHIFT ORCHESTRA  \u00B7  EDITED BY J. MORROW  \u00B7  DIRECTED BY R. VALENTINE';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  // Shrink the billing until both lines fit clear of the barcode.
  let billSize = H * 0.0155;
  for (;;) {
    ctx.font = `700 ${billSize}px ${BODY}`;
    const widest = Math.max(ctx.measureText(bill1).width, ctx.measureText(bill2).width);
    if (widest <= W * 0.76 || billSize <= 8) break;
    billSize -= 0.5;
  }
  ctx.font = `700 ${billSize}px ${BODY}`;
  ctx.fillText(bill1, W / 2, H * 0.872);
  ctx.fillText(bill2, W / 2, H * 0.894);
  ctx.restore();

  // Barcode, bottom right.
  drawBarcode(ctx, W * 0.895, H * 0.855, W * 0.088, H * 0.062);

  // Bottom band: rule, COMING SOON, palm silhouettes.
  ctx.save();
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(W * 0.012, H * 0.934, W * 0.976, Math.max(1.5, H * 0.002));
  ctx.font = `900 ${H * 0.021}px ${DISPLAY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff9ed2';
  ctx.fillText('\u2014  COMING SOON  \u2014', W * 0.02, H * 0.965);
  drawPalm(ctx, W * 0.62, H * 0.988, H * 0.075, '#241536');
  drawPalm(ctx, W * 0.70, H * 0.988, H * 0.055, '#2e1a45');
  drawPalm(ctx, W * 0.78, H * 0.988, H * 0.068, '#241536');
  ctx.restore();

  // Outer frame.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 214, 120, 0.9)';
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeRect(W * 0.006, H * 0.006, W * 0.988, H * 0.988);
  ctx.restore();
}

// Renders a fresh cover at an export size and returns a PNG blob.
export function exportCover(state, photos, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state, photos);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
