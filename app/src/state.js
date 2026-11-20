// The cover's data: the cast, the look, and the words. Nothing here draws;
// render.js turns a state like this into pixels, editor.js lets a person change it.

// One cast member: a sample photo, where their face sits in it (fx/fy are
// fractions of the photo, fh is half the face height as a fraction of the
// photo height), and the name tag the cover prints under them.
export const CAST = [
  { id: 'pier', file: 'samples/pier.jpg', label: 'THE CAPTAIN', fx: 0.38, fy: 0.22, fh: 0.13 },
  { id: 'boulevard', file: 'samples/boulevard.jpg', label: 'THE DRIVER', fx: 0.52, fy: 0.22, fh: 0.13 },
  { id: 'young', file: 'samples/cast-young.jpg', label: 'THE RIDER', fx: 0.47, fy: 0.36, fh: 0.27 },
  { id: 'curly', file: 'samples/cast-curly.jpg', label: 'THE LOOKOUT', fx: 0.47, fy: 0.34, fh: 0.16 },
  { id: 'red', file: 'samples/cast-red.jpg', label: 'THE FIXER', fx: 0.47, fy: 0.37, fh: 0.15 },
  { id: 'silver', file: 'samples/cast-silver.jpg', label: 'THE BOSS', fx: 0.50, fy: 0.35, fh: 0.17 },
];

// A panel is one framed photo on the cover: which cast member, how far the
// camera is zoomed in, and the words on its name tag. The focal point comes
// from the cast member; the editor can nudge it per panel.
export function makePanel(castIndex, zoom = 1) {
  const member = CAST[castIndex];
  return {
    cast: castIndex,
    fx: member.fx,
    fy: member.fy,
    zoom,
    label: member.label,
  };
}

// The default cast order is the Hero layout's order: three on the left,
// the hero in the middle, two on the right.
export function defaultPanels() {
  return [
    makePanel(0), // pier, top left
    makePanel(1), // boulevard, middle left
    makePanel(2), // young, bottom left
    makePanel(3, 1.15), // curly, the hero close-up
    makePanel(4), // red, top right
    makePanel(5), // silver, bottom right
  ];
}

// A layout is a set of slots inside the photo zone. Each slot is a fraction
// of the zone (x, y, w, h) and `order` says which panel goes in each slot,
// so the hero photo can sit in the middle whatever the geometry is.
export const LAYOUTS = [
  {
    id: 'hero', name: 'Hero',
    slots: [
      { x: 0.0, y: 0.0, w: 0.235, h: 0.34 },
      { x: 0.0, y: 0.345, w: 0.235, h: 0.325 },
      { x: 0.0, y: 0.675, w: 0.235, h: 0.325 },
      { x: 0.245, y: 0.0, w: 0.51, h: 1.0 },
      { x: 0.765, y: 0.0, w: 0.235, h: 0.495 },
      { x: 0.765, y: 0.505, w: 0.235, h: 0.495 },
    ],
    order: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'grid', name: 'Grid',
    slots: [
      { x: 0.0, y: 0.0, w: 0.327, h: 0.495 },
      { x: 0.3365, y: 0.0, w: 0.327, h: 0.495 },
      { x: 0.673, y: 0.0, w: 0.327, h: 0.495 },
      { x: 0.0, y: 0.505, w: 0.327, h: 0.495 },
      { x: 0.3365, y: 0.505, w: 0.327, h: 0.495 },
      { x: 0.673, y: 0.505, w: 0.327, h: 0.495 },
    ],
    order: [0, 1, 2, 4, 3, 5],
  },
  {
    id: 'slant', name: 'Slant',
    slots: [
      { x: 0.0, y: 0.0, w: 0.327, h: 0.495 },
      { x: 0.3365, y: 0.0, w: 0.327, h: 0.495 },
      { x: 0.673, y: 0.0, w: 0.327, h: 0.495 },
      { x: 0.0, y: 0.505, w: 0.327, h: 0.495 },
      { x: 0.3365, y: 0.505, w: 0.327, h: 0.495 },
      { x: 0.673, y: 0.505, w: 0.327, h: 0.495 },
    ],
    order: [0, 1, 2, 4, 3, 5],
    slant: 0.035,
  },
  {
    id: 'strips', name: 'Strips',
    slots: [
      { x: 0.0, y: 0.0, w: 0.159, h: 1.0 },
      { x: 0.1682, y: 0.0, w: 0.159, h: 1.0 },
      { x: 0.3364, y: 0.0, w: 0.159, h: 1.0 },
      { x: 0.5046, y: 0.0, w: 0.159, h: 1.0 },
      { x: 0.6728, y: 0.0, w: 0.159, h: 1.0 },
      { x: 0.841, y: 0.0, w: 0.159, h: 1.0 },
    ],
    order: [0, 1, 3, 4, 2, 5],
  },
  {
    id: 'mosaic', name: 'Mosaic',
    slots: [
      { x: 0.0, y: 0.0, w: 0.66, h: 0.66 },
      { x: 0.67, y: 0.0, w: 0.33, h: 0.325 },
      { x: 0.67, y: 0.335, w: 0.33, h: 0.325 },
      { x: 0.0, y: 0.67, w: 0.327, h: 0.33 },
      { x: 0.3365, y: 0.67, w: 0.327, h: 0.33 },
      { x: 0.673, y: 0.67, w: 0.327, h: 0.33 },
    ],
    order: [3, 0, 1, 4, 2, 5],
  },
  {
    id: 'focus', name: 'Focus',
    slots: [
      { x: 0.0, y: 0.0, w: 0.48, h: 1.0 },
      { x: 0.49, y: 0.0, w: 0.25, h: 0.325 },
      { x: 0.75, y: 0.0, w: 0.25, h: 0.325 },
      { x: 0.49, y: 0.335, w: 0.25, h: 0.325 },
      { x: 0.75, y: 0.335, w: 0.25, h: 0.325 },
      { x: 0.49, y: 0.67, w: 0.51, h: 0.33 },
    ],
    order: [3, 0, 1, 4, 2, 5],
  },
  {
    id: 'duo', name: 'Duo',
    slots: [
      { x: 0.0, y: 0.0, w: 0.495, h: 0.55 },
      { x: 0.505, y: 0.0, w: 0.495, h: 0.55 },
      { x: 0.0, y: 0.56, w: 0.2425, h: 0.44 },
      { x: 0.2525, y: 0.56, w: 0.2425, h: 0.44 },
      { x: 0.505, y: 0.56, w: 0.2425, h: 0.44 },
      { x: 0.7575, y: 0.56, w: 0.2425, h: 0.44 },
    ],
    order: [3, 0, 1, 4, 2, 5],
  },
  {
    id: 'stack', name: 'Stack',
    slots: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.158 },
      { x: 0.0, y: 0.168, w: 1.0, h: 0.158 },
      { x: 0.0, y: 0.336, w: 1.0, h: 0.158 },
      { x: 0.0, y: 0.504, w: 1.0, h: 0.158 },
      { x: 0.0, y: 0.672, w: 1.0, h: 0.158 },
      { x: 0.0, y: 0.84, w: 1.0, h: 0.16 },
    ],
    order: [3, 0, 1, 4, 2, 5],
  },
];

// A grade is a colour mood laid over the photos: a wash, a shadow tint,
// and the canvas filter the photos are drawn with.
export const GRADES = [
  { id: 'sunset', name: 'Sunset', wash: 'rgba(255, 110, 60, 0.16)', shade: 'rgba(120, 20, 90, 0.10)', filter: 'saturate(1.25) contrast(1.06)' },
  { id: 'neon', name: 'Neon Nights', wash: 'rgba(255, 40, 160, 0.18)', shade: 'rgba(30, 10, 120, 0.14)', filter: 'saturate(1.45) contrast(1.08)' },
  { id: 'vice', name: 'Vice', wash: 'rgba(140, 60, 255, 0.16)', shade: 'rgba(0, 120, 130, 0.12)', filter: 'saturate(1.35) contrast(1.05)' },
  { id: 'gold', name: 'Golden Hour', wash: 'rgba(255, 180, 60, 0.20)', shade: 'rgba(140, 60, 10, 0.08)', filter: 'saturate(1.3) contrast(1.04) brightness(1.03)' },
  { id: 'noir', name: 'Noir', wash: 'rgba(10, 10, 30, 0.22)', shade: 'rgba(0, 0, 0, 0.18)', filter: 'saturate(0.55) contrast(1.18) brightness(0.96)' },
  { id: 'breeze', name: 'Breeze', wash: 'rgba(60, 180, 255, 0.14)', shade: 'rgba(10, 60, 90, 0.10)', filter: 'saturate(1.15) contrast(1.03) brightness(1.05)' },
  { id: 'ink', name: 'Poster Ink', wash: 'rgba(255, 90, 40, 0.10)', shade: 'rgba(20, 0, 40, 0.16)', filter: 'saturate(1.7) contrast(1.4) brightness(1.02)', comic: true },
];

// A lettering style is how the big title is painted.
export const LETTERINGS = [
  { id: 'chrome', name: 'Chrome Stripes' },
  { id: 'neon', name: 'Neon Glow' },
  { id: 'gold', name: 'Gold Foil' },
  { id: 'outline', name: 'Outline Pop' },
];

export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    lettering: 'chrome',
    title: 'SUNSET HEIST',
    subtitle: 'One Last Summer in Leonida',
    tagline: 'EVERYONE WANTS A CUT OF THE SUNSET',
    quote: 'THE COAST HAS NEVER LOOKED THIS GOOD',
    quoteSource: 'THE LEONIDA LEDGER',
    panels: defaultPanels(),
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
