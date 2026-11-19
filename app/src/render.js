// Neon Cover Studio — cover renderer: draws the whole poster to a canvas.
// One function, drawCover, is the entire art pipeline: graded photos in
// panels, giant lettering crashing over the art, and all the poster
// furniture (stars pill, starburst stamp, ticker band, credits, barcode).

import { layoutById, gradeById, letteringById } from './panels.js';

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// Simple palm silhouette: curved trunk + drooping fronds.
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -34, 22, -58);
  ctx.stroke();
  for (let k = 0; k < 6; k++) {
    const a = Math.PI * (0.08 + k * 0.17);
    const len = 34 - Math.abs(k - 2.5) * 4;
    ctx.beginPath();
    ctx.moveTo(22, -58);
    ctx.quadraticCurveTo(
      22 + Math.cos(a) * len * 0.7, -58 - Math.sin(a) * len * 0.55,
      22 + Math.cos(a) * len, -58 - Math.sin(a) * len * 0.9 + 14,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function starburstPath(ctx, cx, cy, rOuter, rInner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// Draw one photo into a panel rect with its own crop/focus/zoom and grade.
function drawPanelPhoto(ctx, img, rect, crop, grade, W, H) {
  const pw = rect.w;
  const ph = rect.h;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  // Cover-fit the panel, then zoom around the focus point.
  const scale = Math.max(pw / iw, ph / ih) * crop.zoom;
  const sw = pw / scale;
  const sh = ph / scale;
  const sx = clamp(crop.fx * iw - sw / 2, 0, iw - sw);
  const sy = clamp(crop.fy * ih - sh / 2, 0, ih - sh);
  ctx.save();
  ctx.filter = grade.filter;
  ctx.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, pw, ph);
  ctx.restore();
  // Grade tint: three stacked gradients, screen-ish and soft.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const g1 = ctx.createLinearGradient(rect.x, rect.y, rect.x + pw, rect.y + ph);
  g1.addColorStop(0, grade.tint[0]);
  g1.addColorStop(0.55, grade.tint[1]);
  g1.addColorStop(1, grade.tint[2]);
  ctx.fillStyle = g1;
  ctx.fillRect(rect.x, rect.y, pw, ph);
  ctx.restore();
  // Vignette inside the panel so edges read as a printed poster.
  const vg = ctx.createRadialGradient(
    rect.x + pw / 2, rect.y + ph / 2, Math.min(pw, ph) * 0.35,
    rect.x + pw / 2, rect.y + ph / 2, Math.max(pw, ph) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, rect.y, pw, ph);
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function paintTitle(ctx, state, grade, area, W, H) {
  const style = letteringById(state.lettering);
  const title = (state.title || 'NEON NIGHTS').toUpperCase();
  const u = Math.min(W, H) / 100; // 1% of the short side, for scaling
  const maxW = area.w;
  const cx = area.x + area.w / 2;
  const baseline = area.y + area.h * 0.72;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (style.id === 'block') {
    const px = fitFont(ctx, title, maxW, u * 15.5, "'Arial Black', Impact, 'Helvetica Neue', sans-serif", 900);
    const grad = ctx.createLinearGradient(0, baseline - px * 0.95, 0, baseline + px * 0.12);
    grad.addColorStop(0, '#ffe259');
    grad.addColorStop(0.35, '#ff7e2e');
    grad.addColorStop(0.65, '#ff2e88');
    grad.addColorStop(1, '#8b2ff7');
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = u * 2.2;
    ctx.shadowOffsetY = u * 0.9;
    ctx.lineJoin = 'round';
    ctx.lineWidth = u * 1.5;
    ctx.strokeStyle = '#12041f';
    ctx.strokeText(title, cx, baseline);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = grad;
    ctx.fillText(title, cx, baseline);
    // Thin hot highlight stroke on top for a printed-poster pop.
    ctx.lineWidth = u * 0.28;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeText(title, cx, baseline);
  } else if (style.id === 'outline') {
    const px = fitFont(ctx, title, maxW, u * 15.5, "'Arial Black', Impact, sans-serif", 900);
    ctx.lineJoin = 'round';
    ctx.lineWidth = u * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = u * 2.6;
    ctx.strokeText(title, cx, baseline);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(10,4,20,0.55)';
    ctx.fillText(title, cx, baseline);
  } else if (style.id === 'script') {
    const px = fitFont(ctx, title, maxW, u * 13, "'Brush Script MT', 'Segoe Script', cursive", 700);
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = u * 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, cx, baseline);
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = u * 0.35;
    ctx.strokeStyle = grade.glow;
    ctx.strokeText(title, cx, baseline);
  } else {
    const px = fitFont(ctx, title, maxW, u * 14.5, "Georgia, 'Times New Roman', serif", 900);
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = u * 1.6;
    ctx.shadowOffsetY = u * 0.7;
    ctx.lineJoin = 'round';
    ctx.lineWidth = u * 1.1;
    ctx.strokeStyle = '#1a0b00';
    ctx.strokeText(title, cx, baseline);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff3d6';
    ctx.fillText(title, cx, baseline);
  }
  ctx.restore();
  return baseline;
}

function paintSubtitle(ctx, state, grade, W, H, titleBaseline) {
  const u = Math.min(W, H) / 100;
  const sub = state.subtitle || '';
  if (!sub) return;
  ctx.save();
  ctx.textAlign = 'center';
  const px = fitFont(ctx, sub, W * 0.72, u * 4.4, "'Brush Script MT', 'Segoe Script', Georgia, cursive", 700);
  ctx.font = `italic 700 ${px}px 'Brush Script MT', 'Segoe Script', Georgia, cursive`;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = u * 2.4;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(sub, W / 2, titleBaseline + u * 6.0);
  ctx.restore();
}

function paintStarsPill(ctx, state, grade, W, H) {
  if (!state.extras.stars) return;
  const u = Math.min(W, H) / 100;
  const quote = state.quote || 'THE COAST HAS NEVER LOOKED THIS GOOD';
  const pillW = Math.min(W * 0.86, W * 0.62 + H * 0.10);
  const pillH = u * 6.4;
  const x = (W - pillW) / 2;
  const y = H * 0.055;
  ctx.save();
  ctx.fillStyle = 'rgba(8,4,16,0.88)';
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.7)';
  ctx.lineWidth = Math.max(1, u * 0.22);
  ctx.stroke();
  const starR = u * 1.7;
  const starY = y + pillH / 2;
  let sx = x + u * 3.2;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx, starY, starR, '#ffd700');
    sx += starR * 2.35;
  }
  const textX = x + u * 3.2 + starR * 2.35 * 5 + u * 1.6;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const px = fitFont(ctx, `“${quote}” — THE LEONIDA LEDGER`, pillW - (textX - x) - u * 3, u * 2.9, "'Helvetica Neue', Arial, sans-serif", 700);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`“${quote}” — THE LEONIDA LEDGER`, textX, starY);
  ctx.restore();
}

function paintStarburst(ctx, state, W, H) {
  if (!state.extras.stamp) return;
  const u = Math.min(W, H) / 100;
  const cx = W * 0.90;
  const cy = H * 0.16;
  const r = u * 8.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.22);
  starburstPath(ctx, 0, 0, r, r * 0.78, 14);
  ctx.fillStyle = '#ffd400';
  ctx.fill();
  ctx.lineWidth = u * 0.5;
  ctx.strokeStyle = '#c81d25';
  ctx.stroke();
  ctx.fillStyle = '#c81d25';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${u * 2.1}px 'Arial Black', Impact, sans-serif`;
  ctx.fillText('ORIGINAL', 0, -u * 2.2);
  ctx.fillText('COVER ART', 0, u * 0.6);
  ctx.font = `900 ${u * 1.6}px 'Arial Black', Impact, sans-serif`;
  ctx.fillText('★ ★ ★', 0, u * 3.2);
  ctx.restore();
}

function paintPanelLabels(ctx, state, panels, W, H) {
  if (!state.extras.labels) return;
  const u = Math.min(W, H) / 100;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  panels.forEach((p) => {
    const label = p.label || '';
    if (!label) return;
    const px = u * 2.0;
    ctx.font = `800 ${px}px 'Helvetica Neue', Arial, sans-serif`;
    const tw = ctx.measureText(label).width;
    const bw = tw + u * 2.4;
    const bh = u * 3.4;
    const bx = p.x * W + u * 1.2;
    const by = p.y * H + p.h * H - bh - u * 1.4;
    ctx.fillStyle = 'rgba(8,4,16,0.85)';
    roundRect(ctx, bx, by, bw, bh, u * 0.6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, bx + u * 1.2, by + bh / 2 + u * 0.15);
  });
  ctx.restore();
}

function paintVolTag(ctx, state, W, H) {
  if (!state.extras.vol) return;
  const u = Math.min(W, H) / 100;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const text = 'VOL. 1';
  ctx.font = `900 ${u * 3.4}px 'Arial Black', Impact, sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + u * 3;
  const bh = u * 5.4;
  ctx.fillStyle = '#ff2e88';
  roundRect(ctx, W * 0.02, H * 0.008, bw, bh, u * 0.8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, W * 0.02 + u * 1.5, H * 0.008 + bh / 2 + u * 0.2);
  ctx.restore();
}

function paintTicker(ctx, state, grade, W, H) {
  if (!state.extras.ticker) return;
  const u = Math.min(W, H) / 100;
  const bandH = u * 7.2;
  const y = H - bandH;
  ctx.save();
  ctx.fillStyle = '#0a0414';
  ctx.fillRect(0, y, W, bandH);
  ctx.fillStyle = grade.glow;
  ctx.fillRect(0, y, W, u * 0.45);
  const tagline = state.tagline || 'ONE COAST • NO RULES • COMING SOON';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const px = fitFont(ctx, tagline, W * 0.62, u * 3.6, "'Arial Black', Impact, sans-serif", 900);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tagline, W * 0.03, y + bandH / 2 + u * 0.2);
  // Palm silhouettes marching along the right of the band.
  const palmColor = 'rgba(255,255,255,0.9)';
  drawPalm(ctx, W * 0.80, y + bandH - u * 0.4, u * 0.055, palmColor);
  drawPalm(ctx, W * 0.87, y + bandH - u * 0.4, u * 0.075, palmColor);
  drawPalm(ctx, W * 0.95, y + bandH - u * 0.4, u * 0.06, palmColor);
  ctx.restore();
}

function paintFooter(ctx, state, W, H) {
  if (!state.extras.credits) return;
  const u = Math.min(W, H) / 100;
  const bandH = state.extras.ticker ? u * 7.2 : 0;
  const y = H - bandH - u * 2.4;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${u * 1.7}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = u * 0.6;
  ctx.fillText(
    'NEON COVER STUDIO  •  A FAN-MADE POSTER MAKER  •  LEONIDA',
    W * 0.03, y,
  );
  // Barcode, bottom right above the ticker.
  const bx = W * 0.90;
  const bw = W * 0.07;
  const bh = u * 3.4;
  const by = y - bh / 2;
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - u * 0.8, by - u * 0.5, bw + u * 1.6, bh + u * 1.0);
  ctx.fillStyle = '#111111';
  let x = bx;
  const bars = [2, 1, 3, 1, 1, 2, 1, 4, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1];
  bars.forEach((b) => {
    ctx.fillRect(x, by, b * u * 0.16, bh);
    x += (b + 1) * u * 0.16;
  });
  ctx.restore();
}

// The main entry point. `state` is the editor state, `photos` the loaded
// photo objects ({img}). Draws the cover at the canvas's own pixel size.
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  const panels = state.panels || [];

  // Sky backdrop: sunset gradient + glow sun, behind everything.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const sun = ctx.createRadialGradient(W * 0.68, H * 0.30, 0, W * 0.68, H * 0.30, Math.min(W, H) * 0.45);
  sun.addColorStop(0, 'rgba(255,240,180,0.85)');
  sun.addColorStop(0.35, grade.glow + '55');
  sun.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  // Panels.
  const gap = Math.max(3, Math.min(W, H) * 0.006);
  panels.forEach((p, i) => {
    const rect = {
      x: p.x * W + gap / 2,
      y: p.y * H + gap / 2,
      w: p.w * W - gap,
      h: p.h * H - gap,
    };
    ctx.save();
    if (layout.slant) {
      // Diagonal layout: shear each panel into a slanted slice.
      const s = layout.slant * H;
      ctx.beginPath();
      ctx.moveTo(rect.x + s, rect.y);
      ctx.lineTo(rect.x + rect.w + s, rect.y);
      ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
      ctx.lineTo(rect.x - s, rect.y + rect.h);
      ctx.closePath();
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
    }
    const photo = photos[p.photo] || photos[0];
    if (photo && photo.img) {
      drawPanelPhoto(ctx, photo.img, rect, p.crop, grade, W, H);
    } else {
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      g.addColorStop(0, grade.sky[1]);
      g.addColorStop(1, grade.sky[0]);
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    // Panel frame: thin white inner line + dark outer edge.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.0022);
    if (layout.slant) {
      const s = layout.slant * H;
      ctx.beginPath();
      ctx.moveTo(rect.x + s, rect.y);
      ctx.lineTo(rect.x + rect.w + s, rect.y);
      ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
      ctx.lineTo(rect.x - s, rect.y + rect.h);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    void i;
  });

  // Soft dark wash across the lower third so the giant title stays readable.
  const wash = ctx.createLinearGradient(0, H * 0.52, 0, H);
  wash.addColorStop(0, 'rgba(10,2,20,0)');
  wash.addColorStop(0.55, 'rgba(10,2,20,0.42)');
  wash.addColorStop(1, 'rgba(10,2,20,0.72)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, H * 0.52, W, H * 0.48);

  paintStarsPill(ctx, state, grade, W, H);
  paintVolTag(ctx, state, W, H);
  paintStarburst(ctx, state, W, H);
  paintPanelLabels(ctx, state, panels, W, H);

  // Title block: crashes over the lower panels, subtitle script under it.
  const titleArea = { x: W * 0.03, y: H * 0.60, w: W * 0.94, h: H * 0.30 };
  const baseline = paintTitle(ctx, state, grade, titleArea, W, H);
  paintSubtitle(ctx, state, grade, W, H, baseline);
  paintTicker(ctx, state, grade, W, H);
  paintFooter(ctx, state, W, H);
}

// Render a cover at an export size and return a PNG data URL.
export function renderCoverDataURL(state, photos, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state, photos);
  return canvas.toDataURL('image/png');
}

// Render a cover as a JPEG data URL (used for the screenshot files).
export function renderCoverJpeg(state, photos, w, h, quality) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state, photos);
  return canvas.toDataURL('image/jpeg', quality || 0.88);
}
