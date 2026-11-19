// Neon Cover Studio — panel layout definitions for the v2 cover maker.
// Every layout is a set of normalised panel rectangles (0..1 of the cover
// area) plus a default photo slot and a distinct crop for each panel, so
// two panels that share one photo never show the same framing.

export const PANEL_LABELS = [
  'THE DRIVER',
  'THE ANGLER',
  'LAST LIGHT',
  'PIER 9',
  'GOLDEN HOUR',
  'NEON ROW',
  'THE GETAWAY',
  'VICE CITY',
];

// One crop per panel: focus point (fx, fy in 0..1 of the photo) and zoom.
// Defaults are deliberately spread out so the two sample photos look like
// six different shots instead of one repeated picture.
function crop(fx, fy, zoom) {
  return { fx, fy, zoom };
}

export const LAYOUTS = [
  {
    id: 'keyart',
    name: 'Key Art',
    blurb: 'Title crashes over the art',
    panels: [
      { x: 0.0, y: 0.0, w: 0.42, h: 0.62, label: 'THE DRIVER', photo: 0, crop: crop(0.30, 0.42, 1.25) },
      { x: 0.42, y: 0.0, w: 0.30, h: 0.62, label: 'THE ANGLER', photo: 1, crop: crop(0.62, 0.55, 1.35) },
      { x: 0.72, y: 0.0, w: 0.28, h: 0.62, label: 'LAST LIGHT', photo: 0, crop: crop(0.72, 0.30, 1.5) },
      { x: 0.0, y: 0.62, w: 0.30, h: 0.38, label: 'PIER 9', photo: 1, crop: crop(0.25, 0.62, 1.4) },
      { x: 0.30, y: 0.62, w: 0.34, h: 0.38, label: 'GOLDEN HOUR', photo: 0, crop: crop(0.55, 0.68, 1.3) },
      { x: 0.64, y: 0.62, w: 0.36, h: 0.38, label: 'NEON ROW', photo: 1, crop: crop(0.80, 0.35, 1.6) },
    ],
  },
  {
    id: 'poster',
    name: 'Poster',
    blurb: 'Hero left, column right',
    panels: [
      { x: 0.0, y: 0.0, w: 0.58, h: 1.0, label: 'THE DRIVER', photo: 0, crop: crop(0.35, 0.45, 1.15) },
      { x: 0.58, y: 0.0, w: 0.42, h: 0.34, label: 'THE ANGLER', photo: 1, crop: crop(0.60, 0.45, 1.3) },
      { x: 0.58, y: 0.34, w: 0.42, h: 0.33, label: 'LAST LIGHT', photo: 0, crop: crop(0.75, 0.28, 1.55) },
      { x: 0.58, y: 0.67, w: 0.42, h: 0.33, label: 'PIER 9', photo: 1, crop: crop(0.30, 0.70, 1.45) },
    ],
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    blurb: 'Slanted slices',
    slant: 0.09,
    panels: [
      { x: 0.0, y: 0.0, w: 0.38, h: 1.0, label: 'THE DRIVER', photo: 0, crop: crop(0.28, 0.40, 1.2) },
      { x: 0.34, y: 0.0, w: 0.36, h: 1.0, label: 'THE ANGLER', photo: 1, crop: crop(0.55, 0.55, 1.3) },
      { x: 0.66, y: 0.0, w: 0.34, h: 1.0, label: 'LAST LIGHT', photo: 0, crop: crop(0.78, 0.32, 1.5) },
    ],
  },
  {
    id: 'strips',
    name: 'Strips',
    blurb: 'Vertical strips',
    panels: [
      { x: 0.0, y: 0.0, w: 0.20, h: 1.0, label: 'THE DRIVER', photo: 0, crop: crop(0.18, 0.45, 1.35) },
      { x: 0.20, y: 0.0, w: 0.20, h: 1.0, label: 'THE ANGLER', photo: 1, crop: crop(0.45, 0.60, 1.4) },
      { x: 0.40, y: 0.0, w: 0.20, h: 1.0, label: 'LAST LIGHT', photo: 0, crop: crop(0.60, 0.30, 1.5) },
      { x: 0.60, y: 0.0, w: 0.20, h: 1.0, label: 'PIER 9', photo: 1, crop: crop(0.75, 0.40, 1.45) },
      { x: 0.80, y: 0.0, w: 0.20, h: 1.0, label: 'GOLDEN HOUR', photo: 0, crop: crop(0.85, 0.65, 1.6) },
    ],
  },
  {
    id: 'grid6',
    name: 'Grid 6',
    blurb: 'Six equal frames',
    panels: [
      { x: 0.0, y: 0.0, w: 0.333, h: 0.5, label: 'THE DRIVER', photo: 0, crop: crop(0.25, 0.40, 1.4) },
      { x: 0.333, y: 0.0, w: 0.334, h: 0.5, label: 'THE ANGLER', photo: 1, crop: crop(0.50, 0.55, 1.35) },
      { x: 0.667, y: 0.0, w: 0.333, h: 0.5, label: 'LAST LIGHT', photo: 0, crop: crop(0.75, 0.30, 1.5) },
      { x: 0.0, y: 0.5, w: 0.333, h: 0.5, label: 'PIER 9', photo: 1, crop: crop(0.28, 0.65, 1.45) },
      { x: 0.333, y: 0.5, w: 0.334, h: 0.5, label: 'GOLDEN HOUR', photo: 0, crop: crop(0.60, 0.70, 1.3) },
      { x: 0.667, y: 0.5, w: 0.333, h: 0.5, label: 'NEON ROW', photo: 1, crop: crop(0.82, 0.38, 1.6) },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three tall panels',
    panels: [
      { x: 0.0, y: 0.0, w: 0.333, h: 1.0, label: 'THE DRIVER', photo: 0, crop: crop(0.30, 0.45, 1.2) },
      { x: 0.333, y: 0.0, w: 0.334, h: 1.0, label: 'THE ANGLER', photo: 1, crop: crop(0.55, 0.50, 1.25) },
      { x: 0.667, y: 0.0, w: 0.333, h: 1.0, label: 'LAST LIGHT', photo: 0, crop: crop(0.72, 0.35, 1.4) },
    ],
  },
  {
    id: 'billboard',
    name: 'Billboard',
    blurb: 'Wide hero, strip below',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.64, label: 'THE DRIVER', photo: 0, crop: crop(0.45, 0.42, 1.1) },
      { x: 0.0, y: 0.64, w: 0.25, h: 0.36, label: 'THE ANGLER', photo: 1, crop: crop(0.40, 0.55, 1.5) },
      { x: 0.25, y: 0.64, w: 0.25, h: 0.36, label: 'LAST LIGHT', photo: 0, crop: crop(0.70, 0.30, 1.55) },
      { x: 0.50, y: 0.64, w: 0.25, h: 0.36, label: 'PIER 9', photo: 1, crop: crop(0.70, 0.65, 1.5) },
      { x: 0.75, y: 0.64, w: 0.25, h: 0.36, label: 'GOLDEN HOUR', photo: 0, crop: crop(0.20, 0.65, 1.45) },
    ],
  },
  {
    id: 'duo',
    name: 'Duo',
    blurb: 'Two big panels',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 1.0, label: 'THE DRIVER', photo: 0, crop: crop(0.32, 0.45, 1.2) },
      { x: 0.5, y: 0.0, w: 0.5, h: 1.0, label: 'THE ANGLER', photo: 1, crop: crop(0.60, 0.50, 1.25) },
    ],
  },
];

export const GRADES = [
  {
    id: 'neon-sunset', name: 'Neon Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.04)',
    tint: ['rgba(255,94,0,0.16)', 'rgba(255,0,128,0.20)', 'rgba(80,0,160,0.22)'],
    glow: '#ff5e3a', sky: ['#2b1055', '#ff5e3a', '#ffb347'],
  },
  {
    id: 'vice-pink', name: 'Vice Pink',
    filter: 'saturate(1.45) contrast(1.08) brightness(1.05) hue-rotate(-12deg)',
    tint: ['rgba(255,0,150,0.22)', 'rgba(255,80,180,0.14)', 'rgba(120,0,120,0.20)'],
    glow: '#ff2e9a', sky: ['#3d0a4e', '#ff2e9a', '#ff7ad9'],
  },
  {
    id: 'golden-hour', name: 'Golden Hour',
    filter: 'saturate(1.25) contrast(1.10) brightness(1.08) sepia(0.22)',
    tint: ['rgba(255,170,0,0.20)', 'rgba(255,120,0,0.12)', 'rgba(120,60,0,0.14)'],
    glow: '#ffb347', sky: ['#4a2400', '#ff8c00', '#ffd97a'],
  },
  {
    id: 'poster-ink', name: 'Poster Ink',
    filter: 'saturate(1.55) contrast(1.32) brightness(0.98)',
    tint: ['rgba(0,40,120,0.18)', 'rgba(255,60,0,0.14)', 'rgba(0,0,0,0.16)'],
    glow: '#ff3d00', sky: ['#0a1030', '#c81d5e', '#ff7a18'],
  },
  {
    id: 'teal-noir', name: 'Teal Noir',
    filter: 'saturate(1.15) contrast(1.22) brightness(0.94) hue-rotate(18deg)',
    tint: ['rgba(0,180,180,0.16)', 'rgba(0,60,90,0.22)', 'rgba(0,0,0,0.18)'],
    glow: '#00e5c7', sky: ['#02141f', '#0a5e6e', '#00c2a8'],
  },
  {
    id: 'mono-pop', name: 'Mono Pop',
    filter: 'saturate(0.25) contrast(1.35) brightness(1.06)',
    tint: ['rgba(255,40,90,0.20)', 'rgba(255,200,0,0.10)', 'rgba(0,0,0,0.20)'],
    glow: '#ff2e63', sky: ['#111111', '#555555', '#ff2e63'],
  },
];

export const LETTERINGS = [
  { id: 'block', name: 'Block Gradient', blurb: 'Sunset gradient + heavy outline' },
  { id: 'outline', name: 'Outline', blurb: 'Hollow white outline' },
  { id: 'script', name: 'Script', blurb: 'Neon script lettering' },
  { id: 'slab', name: 'Slab', blurb: 'Chunky serif slab' },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function letteringById(id) {
  return LETTERINGS.find((l) => l.id === id) || LETTERINGS[0];
}

// A fresh default panel assignment for a layout: deep copy so the editor
// can mutate crops without touching the definitions above.
export function defaultPanels(layoutId) {
  const layout = layoutById(layoutId);
  return layout.panels.map((p) => ({
    x: p.x, y: p.y, w: p.w, h: p.h,
    label: p.label, photo: p.photo,
    crop: { fx: p.crop.fx, fy: p.crop.fy, zoom: p.crop.zoom },
  }));
}
