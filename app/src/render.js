// The cover renderer for Neon Cover Studio.
//
// Everything is drawn on a plain 2D canvas: photos are cover-fitted into
// leaning polygon panels, a neon-sunset grade is blended over each panel,
// thick pale frames separate the panels, and a bold caption block with a
// colour-bar subtitle anchors the foot of the poster. The same function
// paints the live preview and every exported PNG, so what you see while
// editing is exactly what downloads.

import { getLayout, polygonBounds, tracePolygonPath } from './panels.js';

const TITLE_FONT_STACK = "'Arial Black', 'Archivo Black', Impact, 'Haettenschweiler', 'Arial Narrow Bold', sans-serif";
const LABEL_FONT_STACK = "'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif";

const PLACEHOLDER_WASHES = [
  ['#3b1154', '#8a1c5c'],
  ['#57164a', '#c22e63'],
  ['#2a1a5e', '#7b2ff7'],
  ['#6e1e4f', '#e8503a'],
  ['#40155c', '#a03d8f'],
];

/** Sets canvas letter spacing when the engine supports it, else no-ops. */
function setTracking(ctx, px) {
  try {
    ctx.letterSpacing = `${px}px`;
  } catch {
    // Older engines simply draw untracked type; the layout still holds.
  }
}

/** A rounded-rectangle path centred on (cx, cy). */
function roundedBarPath(ctx, cx, cy, w, h, r) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * The rectangle an image of (imgW, imgH) occupies when cover-fitted into a
 * pixel box, scaled by zoom and nudged by offsets expressed as fractions
 * of the box size. Returned in cover pixel coordinates.
 */
export function coverFitRect(imgW, imgH, box, zoom, offsetX, offsetY) {
  const scale = Math.max(box.width / imgW, box.height / imgH) * Math.max(zoom, 0.05);
  const w = imgW * scale;
  const h = imgH * scale;
  return {
    x: box.cx - w / 2 + offsetX * box.width,
    y: box.cy - h / 2 + offsetY * box.height,
    width: w,
    height: h,
  };
}

/**
 * Draws one panel's photo, clipped to the panel polygon. The photo is
 * cover-fitted into the polygon's bounding box with its own zoom and
 * offset, and lightly saturated so the grade on top lands evenly. With
 * no photo yet, a dusk wash and a quiet hint stand in its place.
 */
export function drawPanelPhoto(ctx, points, width, height, image, transform, panelIndex) {
  const bounds = polygonBounds(points);
  const box = {
    cx: bounds.cx * width,
    cy: bounds.cy * height,
    width: bounds.width * width,
    height: bounds.height * height,
  };
  ctx.save();
  tracePolygonPath(ctx, points, width, height);
  ctx.clip();
  if (image && image.naturalWidth > 0) {
    const rect = coverFitRect(
      image.naturalWidth,
      image.naturalHeight,
      box,
      transform.zoom,
      transform.offsetX,
      transform.offsetY,
    );
    const lift = 1 + transform.grade * 0.45;
    ctx.filter = `saturate(${lift.toFixed(3)}) contrast(${(1 + transform.grade * 0.14).toFixed(3)}) brightness(1.03)`;
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    ctx.filter = 'none';
  } else {
    const [from, to] = PLACEHOLDER_WASHES[panelIndex % PLACEHOLDER_WASHES.length];
    const wash = ctx.createLinearGradient(0, 0, width * 0.4, height);
    wash.addColorStop(0, from);
    wash.addColorStop(1, to);
    ctx.fillStyle = wash;
    ctx.fillRect(box.cx - box.width, box.cy - box.height, box.width * 2, box.height * 2);
    const hintSize = Math.max(13, Math.min(width, height) * 0.026);
    ctx.font = `700 ${hintSize}px ${LABEL_FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    setTracking(ctx, hintSize * 0.22);
    ctx.fillStyle = 'rgba(255, 235, 248, 0.75)';
    ctx.fillText('ADD A PHOTO', box.cx, box.cy);
    setTracking(ctx, 0);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
}

/**
 * Blends the neon-sunset grade over one panel: a diagonal wash running
 * hot orange through pink into deep violet, laid down with overlay and
 * soft-light composites so highlights bloom and shadows turn purple,
 * plus a warm pool gathering at the panel's foot. Intensity is 0 to 1.
 */
export function applyNeonSunsetGrade(ctx, points, width, height, intensity) {
  if (intensity <= 0.001) return;
  ctx.save();
  tracePolygonPath(ctx, points, width, height);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, -height * 0.1, width * 0.35, height * 1.05);
  wash.addColorStop(0, `rgba(255, 176, 66, ${(0.5 * intensity).toFixed(3)})`);
  wash.addColorStop(0.45, `rgba(255, 46, 136, ${(0.55 * intensity).toFixed(3)})`);
  wash.addColorStop(1, `rgba(88, 28, 190, ${(0.6 * intensity).toFixed(3)})`);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  const pool = ctx.createLinearGradient(0, height * 0.55, 0, height);
  pool.addColorStop(0, 'rgba(255, 110, 60, 0)');
  pool.addColorStop(1, `rgba(255, 80, 90, ${(0.22 * intensity).toFixed(3)})`);
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Strokes one panel's frame: a soft dark under-stroke so the seam reads
 * against bright photos, then the thick pale divider line itself. The
 * panel being edited gets a neon edge instead of the pale one.
 */
export function drawPanelFrame(ctx, points, width, height, isSelected) {
  const unit = Math.min(width, height);
  tracePolygonPath(ctx, points, width, height);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(12, 3, 24, 0.85)';
  ctx.lineWidth = Math.max(7, unit * 0.013);
  ctx.stroke();
  tracePolygonPath(ctx, points, width, height);
  ctx.strokeStyle = isSelected ? '#ffcf3f' : '#fdf6ec';
  ctx.lineWidth = Math.max(4, unit * 0.0075);
  ctx.stroke();
  if (isSelected) {
    tracePolygonPath(ctx, points, width, height);
    ctx.strokeStyle = 'rgba(255, 46, 136, 0.55)';
    ctx.lineWidth = Math.max(9, unit * 0.016);
    ctx.stroke();
  }
}

/** A gentle sun bloom high over the cover, shared by every panel. */
export function applySunBloom(ctx, width, height, intensity) {
  if (intensity <= 0.001) return;
  const cx = width * 0.7;
  const cy = height * 0.16;
  const radius = Math.max(width, height) * 0.55;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  glow.addColorStop(0, `rgba(255, 190, 90, ${(0.3 * intensity).toFixed(3)})`);
  glow.addColorStop(0.5, `rgba(255, 110, 120, ${(0.12 * intensity).toFixed(3)})`);
  glow.addColorStop(1, 'rgba(255, 110, 120, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Darkens the foot of the cover so the caption always sits on shade. */
export function applyBottomShade(ctx, width, height) {
  const shade = ctx.createLinearGradient(0, height * 0.5, 0, height);
  shade.addColorStop(0, 'rgba(9, 2, 20, 0)');
  shade.addColorStop(0.62, 'rgba(9, 2, 20, 0.42)');
  shade.addColorStop(1, 'rgba(9, 2, 20, 0.92)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  const cap = ctx.createLinearGradient(0, 0, 0, height * 0.16);
  cap.addColorStop(0, 'rgba(9, 2, 20, 0.4)');
  cap.addColorStop(1, 'rgba(9, 2, 20, 0)');
  ctx.fillStyle = cap;
  ctx.fillRect(0, 0, width, height * 0.16);
}

/** A soft vignette that pulls the eye to the middle of the poster. */
export function applyVignette(ctx, width, height) {
  const radius = Math.max(width, height) * 0.78;
  const ring = ctx.createRadialGradient(width / 2, height / 2, radius * 0.45, width / 2, height / 2, radius);
  ring.addColorStop(0, 'rgba(6, 0, 14, 0)');
  ring.addColorStop(1, 'rgba(6, 0, 14, 0.36)');
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, width, height);
}

/** The small studio wordmark pill riding at the top of the poster. */
export function drawStudioBadge(ctx, width, height) {
  const unit = Math.min(width, height);
  const size = Math.max(12, unit * 0.024);
  const text = 'NEON COVER STUDIO';
  ctx.save();
  ctx.font = `800 ${size}px ${LABEL_FONT_STACK}`;
  setTracking(ctx, size * 0.34);
  const textWidth = ctx.measureText(text).width;
  const pillW = textWidth + size * 2.2;
  const pillH = size * 2.05;
  const cx = width / 2;
  const cy = unit * 0.052;
  roundedBarPath(ctx, cx, cy, pillW, pillH, pillH / 2);
  ctx.fillStyle = 'rgba(10, 3, 24, 0.58)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 150, 205, 0.65)';
  ctx.lineWidth = Math.max(1, unit * 0.0016);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd9ec';
  ctx.fillText(text, cx, cy + size * 0.05);
  ctx.restore();
}

/**
 * The caption block: a gradient colour bar carrying the subtitle, and
 * below it the title in heavy condensed capitals — a neon offset echo,
 * a deep outline, and a bright face — shrunk until it fits the width.
 */
export function drawCaptionLettering(ctx, width, height, title, subtitle) {
  const unit = Math.min(width, height);
  const cleanTitle = (title ?? '').trim().toUpperCase() || 'NEON NIGHTS';
  const cleanSub = (subtitle ?? '').trim().toUpperCase();

  let titleSize = unit * 0.118;
  ctx.save();
  const setTitleFont = () => {
    ctx.font = `${titleSize}px ${TITLE_FONT_STACK}`;
    setTracking(ctx, -titleSize * 0.01);
  };
  setTitleFont();
  while (ctx.measureText(cleanTitle).width > width * 0.92 && titleSize > 14) {
    titleSize *= 0.94;
    setTitleFont();
  }
  const titleBaseline = height - unit * 0.052;
  const titleCentreY = titleBaseline - titleSize * 0.36;

  if (cleanSub) {
    let subSize = unit * 0.033;
    ctx.font = `800 ${subSize}px ${LABEL_FONT_STACK}`;
    setTracking(ctx, subSize * 0.3);
    while (ctx.measureText(cleanSub).width > width * 0.8 && subSize > 9) {
      subSize *= 0.93;
      ctx.font = `800 ${subSize}px ${LABEL_FONT_STACK}`;
      setTracking(ctx, subSize * 0.3);
    }
    const subWidth = ctx.measureText(cleanSub).width;
    const barW = subWidth + subSize * 2.6;
    const barH = subSize * 2.0;
    const barY = titleCentreY - titleSize * 0.72 - barH * 0.4;
    const barGrad = ctx.createLinearGradient(width / 2 - barW / 2, 0, width / 2 + barW / 2, 0);
    barGrad.addColorStop(0, '#ff9a3d');
    barGrad.addColorStop(0.5, '#ff2e88');
    barGrad.addColorStop(1, '#7b2ff7');
    roundedBarPath(ctx, width / 2, barY, barW, barH, barH * 0.32);
    ctx.fillStyle = barGrad;
    ctx.shadowColor = 'rgba(255, 46, 136, 0.55)';
    ctx.shadowBlur = unit * 0.02;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff7fb';
    ctx.fillText(cleanSub, width / 2, barY + subSize * 0.06);
    ctx.textBaseline = 'alphabetic';
  }

  // The title itself, sheared a touch for pace, echo first, face last.
  // A soft dark shadow under the whole word lifts it off bright panels,
  // so the lettering stays readable over sunlit photos.
  ctx.translate(width / 2, titleBaseline);
  ctx.transform(1, 0, -0.055, 1, 0, 0);
  setTitleFont();
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(8, 1, 18, 0.55)';
  ctx.shadowBlur = titleSize * 0.16;
  ctx.shadowOffsetY = titleSize * 0.05;
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(cleanTitle, titleSize * 0.045, titleSize * 0.055);
  ctx.strokeStyle = '#160329';
  ctx.lineWidth = titleSize * 0.2;
  ctx.strokeText(cleanTitle, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(cleanTitle, 0, 0);
  ctx.restore();
  setTracking(ctx, 0);
}

/**
 * Paints the whole cover described by state onto ctx at width by height.
 * State: { layoutId, panelShots: [{ image, zoom, offsetX, offsetY }],
 * selectedPanel, showSelection, title, subtitle, grade }.
 */
export function renderCoverArt(ctx, width, height, state) {
  const layout = getLayout(state.layoutId);
  ctx.save();
  ctx.fillStyle = '#150826';
  ctx.fillRect(0, 0, width, height);

  layout.panels.forEach((panel, index) => {
    const shot = state.panelShots[index] ?? { image: null, zoom: 1, offsetX: 0, offsetY: 0 };
    drawPanelPhoto(ctx, panel.points, width, height, shot.image, { ...shot, grade: state.grade }, index);
    applyNeonSunsetGrade(ctx, panel.points, width, height, state.grade);
  });

  applySunBloom(ctx, width, height, state.grade);
  layout.panels.forEach((panel, index) => {
    drawPanelFrame(ctx, panel.points, width, height, state.showSelection && index === state.selectedPanel);
  });

  applyBottomShade(ctx, width, height);
  drawCaptionLettering(ctx, width, height, state.title, state.subtitle);
  drawStudioBadge(ctx, width, height);
  applyVignette(ctx, width, height);
  ctx.restore();
}
