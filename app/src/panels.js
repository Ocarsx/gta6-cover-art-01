// Panel layouts for Neon Cover Studio.
//
// Every layout is a set of polygons in normalised cover coordinates
// (x and y both run from 0 to 1), so one composition stretches cleanly
// to a square post, a portrait post or a wide banner. The polygons lean
// and stack the way a multi-panel poster does: a hero shot, supporting
// slices beside it, and thick pale dividers drawn over the seams.

export const LAYOUTS = [
  {
    id: 'poster',
    name: 'Poster',
    blurb: 'One hero panel with a stacked column leaning beside it',
    panels: [
      { label: 'Hero', points: [[0, 0], [0.56, 0], [0.5, 1], [0, 1]] },
      { label: 'Top right', points: [[0.56, 0], [1, 0], [1, 0.33], [0.54, 0.33]] },
      { label: 'Mid right', points: [[0.54, 0.33], [1, 0.33], [1, 0.66], [0.52, 0.66]] },
      { label: 'Low right', points: [[0.52, 0.66], [1, 0.66], [1, 1], [0.5, 1]] },
    ],
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    blurb: 'Four slanted slices leaning into the sunset',
    panels: [
      { label: 'Slice one', points: [[0, 0], [0.34, 0], [0.22, 1], [0, 1]] },
      { label: 'Slice two', points: [[0.34, 0], [0.58, 0], [0.46, 1], [0.22, 1]] },
      { label: 'Slice three', points: [[0.58, 0], [0.8, 0], [0.68, 1], [0.46, 1]] },
      { label: 'Slice four', points: [[0.8, 0], [1, 0], [1, 1], [0.68, 1]] },
    ],
  },
  {
    id: 'strips',
    name: 'Strips',
    blurb: 'Vertical strips with a split finale on the right',
    panels: [
      { label: 'Strip one', points: [[0, 0], [0.3, 0], [0.3, 1], [0, 1]] },
      { label: 'Strip two', points: [[0.3, 0], [0.55, 0], [0.55, 1], [0.3, 1]] },
      { label: 'Strip three', points: [[0.55, 0], [0.78, 0], [0.78, 1], [0.55, 1]] },
      { label: 'Finale top', points: [[0.78, 0], [1, 0], [1, 0.52], [0.78, 0.52]] },
      { label: 'Finale low', points: [[0.78, 0.52], [1, 0.52], [1, 1], [0.78, 1]] },
    ],
  },
];

/** The layout with this id, or the first layout when the id is unknown. */
export function getLayout(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

/**
 * The bounding box of a normalised polygon, still in normalised units:
 * its corners, its size and its centre. Photo fitting works in this box.
 */
export function polygonBounds(points) {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

/** Ray-casting hit test: is the normalised point (x, y) inside the polygon? */
export function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Begins a canvas path tracing the polygon scaled to a width by height cover. */
export function tracePolygonPath(ctx, points, width, height) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x * width, y * height);
    else ctx.lineTo(x * width, y * height);
  });
  ctx.closePath();
}
