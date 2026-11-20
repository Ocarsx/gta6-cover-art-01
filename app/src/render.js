// Cover Art Studio III — the cover engine. One function, drawCover, paints the
// whole poster on a canvas at any size: quote band, photo panels, the giant
// title in its own dark band below the photos, billing, barcode, starburst and
// the COMING SOON strip. Everything is drawn from the state, so the live
// preview and the exported PNG are the same picture.

import { ROLES, quoteOf } from './state.js';

const SANS = '"Noto Sans", "Liberation Sans", "Arial Black", sans-serif';
const SERIF = '"Noto Serif", Georgia, serif';

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function star(ctx, cx, cy, r, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainPattern = null;
function grain(ctx, W, H) {
  if (!grainPattern) {
    const c = document.createElement('canvas');
    c.width = 140;
    c.height = 140;
    const g = c.getContext('2d');
    const img = g.createImageData(140, 140);
    const rnd = mulberry32(20261121);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 118 + Math.floor(rnd() * 20);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(c, 'repeat');
  }
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

let dotPattern = null;
function halftoneDots(ctx) {
  if (!dotPattern) {
    const c = document.createElement('canvas');
    c.width = 11;
    c.height = 11;
    const g = c.getContext('2d');
    g.fillStyle = '#160826';
    g.beginPath();
    g.arc(5.5, 5.5, 2.4, 0, Math.PI * 2);
    g.fill();
    dotPattern = g.createPattern(c, 'repeat');
  }
  return dotPattern;
}

// ---------------------------------------------------------------- grades

function gradeFilter(grade) {
  switch (grade) {
    case 'neon': return 'saturate(1.5) contrast(1.12) hue-rotate(-12deg)';
    case 'gold': return 'saturate(1.25) contrast(1.05) sepia(0.32)';
    case 'comic': return 'saturate(1.6) contrast(1.35) brightness(1.05)';
    case 'noir': return 'grayscale(1) contrast(1.25) brightness(1.05)';
    case 'teal': return 'saturate(1.2) contrast(1.08) hue-rotate(14deg)';
    default: return 'saturate(1.3) contrast(1.06) brightness(1.03) sepia(0.18)';
  }
}

function gradeOverlay(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  let grad = null;
  if (grade === 'sunset') {
    grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(255,120,40,0.10)');
    grad.addColorStop(1, 'rgba(255,46,136,0.14)');
  } else if (grade === 'neon') {
    grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(255,0,140,0.16)');
    grad.addColorStop(1, 'rgba(0,220,255,0.14)');
  } else if (grade === 'gold') {
    grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(247,201,72,0.16)');
    grad.addColorStop(1, 'rgba(20,120,110,0.10)');
  } else if (grade === 'teal') {
    grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(0,180,200,0.12)');
    grad.addColorStop(1, 'rgba(255,140,60,0.10)');
  }
  if (grad) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  if (grade === 'comic') {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = halftoneDots(ctx);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  // Vignette on every grade: the edges fall away into the poster's dark purple.
  const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(10,4,24,0)');
  vg.addColorStop(1, 'rgba(10,4,24,0.30)');
  ctx.save();
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ---------------------------------------------------------------- layouts

// Every layout returns six panel rects in grid fractions: [x0, y0, x1, y1, rotation].
function layoutRects(layout, grid) {
  const g = grid.gap;
  const cell = (x0, y0, x1, y1, rot = 0) => ({
    x: grid.x + x0 * grid.w + g / 2,
    y: grid.y + y0 * grid.h + g / 2,
    w: (x1 - x0) * grid.w - g,
    h: (y1 - y0) * grid.h - g,
    rot,
  });
  switch (layout) {
    case 'hero':
      return [
        cell(0, 0, 0.3, 0.395), cell(0.305, 0, 0.695, 0.795), cell(0.7, 0, 1, 0.395),
        cell(0, 0.405, 0.3, 0.795), cell(0.7, 0.405, 1, 0.795), cell(0, 0.805, 1, 1),
      ];
    case 'diagonal':
      return [
        cell(0, 0, 1 / 3, 0.5, -0.035), cell(1 / 3, 0, 2 / 3, 0.5, 0.03), cell(2 / 3, 0, 1, 0.5, -0.03),
        cell(0, 0.5, 1 / 3, 1, 0.03), cell(1 / 3, 0.5, 2 / 3, 1, -0.035), cell(2 / 3, 0.5, 1, 1, 0.028),
      ];
    case 'strips':
      return [0, 1, 2, 3, 4, 5].map((i) => cell(i / 6, 0, (i + 1) / 6, 1));
    case 'duo':
      return [
        cell(0, 0, 0.5, 0.56), cell(0.5, 0, 1, 0.56),
        cell(0, 0.57, 0.25, 1), cell(0.25, 0.57, 0.5, 1), cell(0.5, 0.57, 0.75, 1), cell(0.75, 0.57, 1, 1),
      ];
    case 'spotlight':
      return [
        cell(0.53, 0, 0.765, 0.31), cell(0, 0, 0.52, 1), cell(0.775, 0, 1, 0.31),
        cell(0.53, 0.32, 0.765, 0.63), cell(0.775, 0.32, 1, 0.63), cell(0.53, 0.64, 1, 1),
      ];
    default: // grid
      return [
        cell(0, 0, 1 / 3, 0.5), cell(1 / 3, 0, 2 / 3, 0.5), cell(2 / 3, 0, 1, 0.5),
        cell(0, 0.5, 1 / 3, 1), cell(1 / 3, 0.5, 2 / 3, 1), cell(2 / 3, 0.5, 1, 1),
      ];
  }
}

// ---------------------------------------------------------------- photo panels

function drawPhoto(ctx, img, rect, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img && img.naturalWidth > 0) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih) * panel.zoom;
    const sw = w / scale;
    const sh = h / scale;
    let sx = panel.fx * iw - sw / 2;
    let sy = panel.fy * ih - sh / 2;
    sx = clamp(sx, 0, iw - sw);
    sy = clamp(sy, 0, ih - sh);
    ctx.filter = gradeFilter(grade);
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.filter = 'none';
  } else {
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, '#3a1a5e');
    bg.addColorStop(1, '#160826');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
  }
  gradeOverlay(ctx, rect, grade);
  ctx.restore();
  // Gold frame with a dark inner line, or a heavy ink edge for the comic grade.
  ctx.save();
  if (grade === 'comic') {
    ctx.lineWidth = Math.max(4, w * 0.012);
    ctx.strokeStyle = '#160826';
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = Math.max(1.5, w * 0.003);
    ctx.strokeStyle = '#f7c948';
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  } else {
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeStyle = 'rgba(247,201,72,0.9)';
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(10,4,24,0.5)';
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }
  ctx.restore();
}

function drawRoleChip(ctx, rect, roleText) {
  const chipH = Math.max(20, rect.h * 0.115);
  const fontSize = chipH * 0.52;
  ctx.save();
  ctx.font = `800 ${fontSize}px ${SANS}`;
  try { ctx.letterSpacing = '0.04em'; } catch { /* older canvas */ }
  const textW = ctx.measureText(roleText).width;
  const slashW = chipH * 0.3;
  const pad = chipH * 0.32;
  const chipW = slashW + pad * 2 + textW + chipH * 0.25;
  const cx = rect.x + rect.w * 0.03;
  const cy = rect.y + rect.h - chipH - rect.h * 0.045;
  ctx.fillStyle = 'rgba(8,3,20,0.92)';
  rr(ctx, cx, cy, chipW, chipH, chipH * 0.22);
  ctx.fill();
  // Gold slash at the chip's left edge.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.moveTo(cx + chipH * 0.34, cy + chipH * 0.18);
  ctx.lineTo(cx + chipH * 0.52, cy + chipH * 0.18);
  ctx.lineTo(cx + chipH * 0.3, cy + chipH * 0.82);
  ctx.lineTo(cx + chipH * 0.12, cy + chipH * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleText, cx + slashW + pad, cy + chipH * 0.54);
  ctx.restore();
}

function drawPanel(ctx, img, rect, panel, grade) {
  ctx.save();
  if (rect.rot) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(rect.rot);
    const grown = { x: -rect.w * 0.53, y: -rect.h * 0.53, w: rect.w * 1.06, h: rect.h * 1.06 };
    drawPhoto(ctx, img, grown, panel, grade);
    drawRoleChip(ctx, grown, ROLES[panel.role]);
    ctx.restore();
  } else {
    drawPhoto(ctx, img, rect, panel, grade);
    drawRoleChip(ctx, rect, ROLES[panel.role]);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- furniture

function drawQuoteBand(ctx, state, W, qH) {
  const quote = quoteOf(state);
  const bg = ctx.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, '#2a0f45');
  bg.addColorStop(0.5, '#1c0b33');
  bg.addColorStop(1, '#2a0f45');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, qH);
  ctx.fillStyle = 'rgba(255,46,136,0.65)';
  ctx.fillRect(0, qH - 2, W, 2);

  // Five gold stars on the left.
  const starR = qH * 0.26;
  let sx = W * 0.018 + starR;
  ctx.fillStyle = '#f7c948';
  for (let i = 0; i < 5; i++) {
    star(ctx, sx, qH / 2, starR);
    ctx.fill();
    sx += starR * 2.35;
  }

  // VOL. 1 pill on the right.
  const pillH = qH * 0.62;
  const pillFont = pillH * 0.52;
  ctx.save();
  ctx.font = `900 ${pillFont}px ${SANS}`;
  const volW = ctx.measureText('VOL. 1').width + pillH * 1.1;
  const vx = W - W * 0.018 - volW;
  ctx.fillStyle = '#f7c948';
  rr(ctx, vx, (qH - pillH) / 2, volW, pillH, pillH * 0.25);
  ctx.fill();
  ctx.fillStyle = '#1c0b33';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VOL. 1', vx + volW / 2, qH / 2 + pillH * 0.04);
  ctx.restore();

  // Quote, fitted between the stars and the pill: quote in white, source in gold.
  const maxW = vx - sx - W * 0.02;
  let size = qH * 0.42;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const quoted = `\u201C${quote.text}\u201D`;
  const sourced = `\u2014  ${quote.source}`;
  let quoteW = 0;
  let sourceW = 0;
  while (size > qH * 0.2) {
    ctx.font = `800 ${size}px ${SANS}`;
    quoteW = ctx.measureText(quoted).width;
    ctx.font = `800 ${size * 0.92}px ${SANS}`;
    sourceW = ctx.measureText(sourced).width;
    if (quoteW + size * 0.25 + sourceW <= maxW) break;
    size *= 0.94;
  }
  const gap = size * 0.25;
  const startX = sx + (maxW - quoteW - gap - sourceW) / 2;
  ctx.font = `800 ${size}px ${SANS}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(quoted, startX, qH / 2);
  ctx.font = `800 ${size * 0.92}px ${SANS}`;
  ctx.fillStyle = '#f7c948';
  ctx.fillText(sourced, startX + quoteW + gap, qH / 2);
  ctx.restore();
}

function titleFont(size, condensed = true) {
  return `900 ${size}px ${SANS}`;
}

function drawTitle(ctx, state, band, W) {
  const { top, h } = band;
  // Fit the title to the width first, then to the band's height.
  let size = Math.min(W * 0.135, h * 0.52);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = '0.015em'; } catch { /* older canvas */ }
  const maxW = W * 0.92;
  while (size > 30) {
    ctx.font = titleFont(size);
    if (ctx.measureText(state.title.toUpperCase()).width * 0.86 <= maxW) break;
    size *= 0.95;
  }
  const subSize = size * 0.3;
  const tagSize = size * 0.185;
  const pillH = tagSize * 1.9;
  const stackH = size * 0.78 + subSize * 1.3 + tagSize * 0.55 + pillH;
  let y = top + (h - stackH) / 2;
  const cx = W / 2;

  // The title itself, drawn condensed (scaleX 0.86) with a thick dark edge.
  const titleY = y + size * 0.72;
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(0.86, 1);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1c0b33';
  ctx.lineWidth = size * 0.14;
  ctx.shadowColor = 'rgba(255,46,136,0.5)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.03;
  ctx.strokeText(state.title.toUpperCase(), 0, titleY);
  if (state.lettering === 'chrome') {
    const grad = ctx.createLinearGradient(0, titleY - size * 0.78, 0, titleY + size * 0.08);
    grad.addColorStop(0, '#fff3a0');
    grad.addColorStop(0.22, '#ffd23e');
    grad.addColorStop(0.24, '#ff9d00');
    grad.addColorStop(0.42, '#ff7a1a');
    grad.addColorStop(0.44, '#ff2e88');
    grad.addColorStop(0.62, '#ff2e88');
    grad.addColorStop(0.64, '#c44dff');
    grad.addColorStop(0.82, '#7a2bff');
    grad.addColorStop(0.84, '#5b1fd6');
    grad.addColorStop(1, '#4a17b8');
    ctx.fillStyle = grad;
  } else if (state.lettering === 'neon') {
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.3;
    ctx.fillStyle = '#ff4fd8';
  } else if (state.lettering === 'gold') {
    const grad = ctx.createLinearGradient(0, titleY - size * 0.78, 0, titleY);
    grad.addColorStop(0, '#fff6c0');
    grad.addColorStop(0.5, '#f7c948');
    grad.addColorStop(1, '#b97f10');
    ctx.fillStyle = grad;
  } else {
    // Outline Pop: white letters, pink edge, hard offset shadow.
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1c0b33';
    ctx.fillText(state.title.toUpperCase(), size * 0.045, titleY + size * 0.045);
    ctx.strokeStyle = '#ff2e88';
    ctx.lineWidth = size * 0.09;
    ctx.strokeText(state.title.toUpperCase(), 0, titleY);
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillText(state.title.toUpperCase(), 0, titleY);
  ctx.restore();

  // Script subtitle in pink, with a thin white edge so it reads over the band.
  const subY = titleY + subSize * 1.3;
  ctx.save();
  ctx.font = `italic 700 ${subSize}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(1.5, subSize * 0.045);
  ctx.strokeText(state.subtitle, cx, subY);
  ctx.fillStyle = '#ff7ad9';
  ctx.fillText(state.subtitle, cx, subY);
  ctx.restore();

  // Tagline pill.
  ctx.save();
  ctx.font = `800 ${tagSize}px ${SANS}`;
  try { ctx.letterSpacing = '0.08em'; } catch { /* older canvas */ }
  const tw = ctx.measureText(state.tagline.toUpperCase()).width;
  const pw = tw + tagSize * 2.4;
  const px = cx - pw / 2;
  const py = subY + tagSize * 0.55;
  ctx.fillStyle = 'rgba(20,8,42,0.6)';
  rr(ctx, px, py, pw, pillH, pillH / 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, tagSize * 0.12);
  ctx.strokeStyle = '#ff5db1';
  rr(ctx, px, py, pw, pillH, pillH / 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd7ef';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.tagline.toUpperCase(), cx, py + pillH / 2 + tagSize * 0.05);
  ctx.restore();
  ctx.restore();
}

function drawStarburst(ctx, W, gridBot) {
  const R = W * 0.052;
  const cx = W - W * 0.0125 - R * 0.72;
  const cy = gridBot - R * 0.08;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? R : R * 0.8;
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const gold = ctx.createRadialGradient(0, -R * 0.3, R * 0.1, 0, 0, R);
  gold.addColorStop(0, '#ffe27a');
  gold.addColorStop(0.6, '#f7c948');
  gold.addColorStop(1, '#f7a928');
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.lineWidth = R * 0.07;
  ctx.strokeStyle = '#c81e3a';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.lineWidth = R * 0.02;
  ctx.strokeStyle = 'rgba(200,30,58,0.55)';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#7a0e22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${R * 0.19}px ${SANS}`;
  ctx.fillText('ORIGINAL', 0, -R * 0.26);
  ctx.fillText('COVER ART', 0, R * 0.02);
  ctx.font = `900 ${R * 0.22}px ${SANS}`;
  ctx.fillText('\u2605\u2605\u2605', 0, R * 0.32);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  const rnd = mulberry32(10472);
  let bx = x + w * 0.08;
  const barTop = y + h * 0.1;
  const barH = h * 0.62;
  while (bx < x + w * 0.92) {
    const bw = (1 + Math.floor(rnd() * 4)) * (w * 0.008);
    if (rnd() > 0.35) {
      ctx.fillStyle = '#111111';
      ctx.fillRect(bx, barTop, bw, barH);
    }
    bx += bw + w * 0.008;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(9, h * 0.13)}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0 10472 05991 8', x + w / 2, y + h * 0.86);
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -34, 16, -62);
  ctx.stroke();
  // Fronds.
  ctx.lineWidth = 4;
  const fronds = [[-52, -66], [-30, -84], [0, -92], [30, -86], [52, -68], [58, -46], [-58, -48]];
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(16, -62);
    ctx.quadraticCurveTo((16 + fx) / 2, fy - 12, fx, fy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBilling(ctx, state, W, top, h, gx) {
  const barW = W * 0.082;
  const barH = h * 0.72;
  const barX = W - gx - barW;
  const barY = top + (h - barH) / 2;
  if (state.showBilling) drawBarcode(ctx, barX, barY, barW, barH);
  const maxW = (state.showBilling ? barX - W * 0.02 : W - gx * 2) - gx;
  const cx = gx + maxW / 2;
  let size = Math.min(W * 0.0115, h * 0.26);
  const line1 = 'A GOLDEN MILE PICTURES PRODUCTION   IN ASSOCIATION WITH PALM & PISTOL   \u00B7   A R. VALENTINE FILM';
  const line2 = `${state.title.toUpperCase()}   MUSIC BY THE NIGHT SHIFT ORCHESTRA   EDITED BY J. MORROW   DIRECTED BY R. VALENTINE`;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  // Letter spacing must be set before measuring, or the fitted text draws
  // wider than measured and runs under the barcode.
  try { ctx.letterSpacing = '0.05em'; } catch { /* older canvas */ }
  while (size > 8) {
    ctx.font = `700 ${size}px ${SANS}`;
    if (Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) <= maxW) break;
    size *= 0.95;
  }
  ctx.fillText(line1, cx, top + h * 0.32);
  ctx.fillText(line2, cx, top + h * 0.68);
  ctx.restore();
}

// ---------------------------------------------------------------- the cover

export function drawCover(ctx, state, images, W, H) {
  const aspect = W / H;
  const qH = H * 0.058;
  const gx = W * 0.0125;
  const gridTop = qH + H * 0.008;
  const gridH = H * (aspect >= 1.5 ? 0.525 : aspect >= 0.9 ? 0.47 : 0.43);
  const gridBot = gridTop + gridH;
  const bottomH = H * 0.048;
  const billingH = H * 0.088;
  const titleTop = gridBot + H * 0.006;
  const titleH = H - titleTop - billingH - bottomH;

  // Backdrop: deep purple with a warm glow behind the title band.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b0f4a');
  bg.addColorStop(0.55, '#1c0b33');
  bg.addColorStop(1, '#150826');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, titleTop + titleH * 0.4, 10, W / 2, titleTop + titleH * 0.4, W * 0.55);
  glow.addColorStop(0, 'rgba(255,46,136,0.16)');
  glow.addColorStop(1, 'rgba(255,46,136,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, titleTop, W, titleH);

  drawQuoteBand(ctx, state, W, qH);

  const grid = { x: gx, y: gridTop, w: W - gx * 2, h: gridH, gap: W * 0.0045 };
  const rects = layoutRects(state.layout, grid);
  state.panels.forEach((panel, i) => {
    const img = images.get(panel.photo) ?? null;
    drawPanel(ctx, img, rects[i], panel, state.grade);
  });

  drawTitle(ctx, state, { top: titleTop, h: titleH }, W);

  if (state.showStarburst) drawStarburst(ctx, W, gridBot);
  if (state.showBilling) drawBilling(ctx, state, W, titleTop + titleH, billingH, gx);

  // COMING SOON strip with palm silhouettes.
  const by = H - bottomH;
  ctx.fillStyle = 'rgba(255,46,136,0.7)';
  ctx.fillRect(0, by, W, 2);
  ctx.save();
  ctx.fillStyle = '#ff5db1';
  ctx.font = `900 ${bottomH * 0.52}px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2014  COMING SOON  \u2014', gx, by + bottomH / 2 + bottomH * 0.03);
  ctx.restore();
  const palmColor = '#4a2472';
  const ps = bottomH * 0.016;
  drawPalm(ctx, W * 0.6, H - bottomH * 0.08, ps, palmColor);
  drawPalm(ctx, W * 0.68, H - bottomH * 0.08, ps * 1.25, palmColor);
  drawPalm(ctx, W * 0.77, H - bottomH * 0.08, ps * 0.9, palmColor);

  // Thin gold frame around the whole poster.
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(247,201,72,0.35)';
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.restore();

  grain(ctx, W, H);
}

export function exportCover(state, images, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), state, images, w, h);
  return canvas;
}
