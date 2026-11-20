// Cover Art Studio III — the state of one cover: which photos sit in which
// panel, how each one is cropped, and every word and effect on the poster.
// Nothing here touches the network; the sample photos live under app/samples/.

export const SAMPLES = [
  { id: 'young', file: 'samples/cast-young.jpg', label: 'Neon street — young man' },
  { id: 'boulevard', file: 'samples/boulevard.jpg', label: 'Boulevard — woman & convertible' },
  { id: 'red', file: 'samples/cast-red.jpg', label: 'Leonida Blvd — red-haired woman' },
  { id: 'pier', file: 'samples/pier.jpg', label: 'Pier — fisherman, bucket hat' },
  { id: 'curly', file: 'samples/cast-curly.jpg', label: 'Boardwalk — curly hair, aviators' },
  { id: 'silver', file: 'samples/cast-silver.jpg', label: 'Rooftop dusk — silver-haired man' },
];

export const ROLES = ['THE RIDER', 'THE DRIVER', 'THE FIXER', 'THE CAPTAIN', 'THE LOOKOUT', 'THE BOSS'];

// One panel per role, in the order the grid reads them: three across the top,
// three across the bottom. fx/fy is the focal point of the photo (0..1) and
// zoom pulls the crop in; faceSafe keeps the focal point near the face zone.
export const DEFAULT_PANELS = [
  { photo: 'young', role: 0, fx: 0.5, fy: 0.3, zoom: 1.02, faceSafe: true },
  { photo: 'boulevard', role: 1, fx: 0.5, fy: 0.19, zoom: 1.08, faceSafe: true },
  { photo: 'red', role: 2, fx: 0.5, fy: 0.33, zoom: 1.1, faceSafe: true },
  { photo: 'pier', role: 3, fx: 0.5, fy: 0.22, zoom: 1.1, faceSafe: true },
  { photo: 'curly', role: 4, fx: 0.5, fy: 0.3, zoom: 1.12, faceSafe: true },
  { photo: 'silver', role: 5, fx: 0.5, fy: 0.3, zoom: 1.1, faceSafe: true },
];

export const LAYOUTS = [
  { id: 'grid', name: 'Grid — six panels, title below', blurb: 'Three over three, the classic poster grid.' },
  { id: 'hero', name: 'Hero — big face centre', blurb: 'One large centre portrait, four corners, a wide strip.' },
  { id: 'diagonal', name: 'Diagonal — tilted snapshots', blurb: 'The grid kicked a few degrees off square.' },
  { id: 'strips', name: 'Strips — six verticals', blurb: 'Six tall slices side by side.' },
  { id: 'duo', name: 'Duo — two leads, four below', blurb: 'Two big faces on top, the crew in a row beneath.' },
  { id: 'spotlight', name: 'Spotlight — one lead, five crew', blurb: 'A lead portrait left, the rest stacked right.' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', blurb: 'Warm golden-hour glow.' },
  { id: 'neon', name: 'Neon Nights', blurb: 'Magenta shadows, teal light.' },
  { id: 'gold', name: 'Vice Gold', blurb: 'Gold highlights over deep teal.' },
  { id: 'comic', name: 'Comic Halftone', blurb: 'Inked panels, halftone dots, poster print.' },
  { id: 'noir', name: 'Noir', blurb: 'Black and white, hard contrast.' },
  { id: 'teal', name: 'Palm Teal', blurb: 'Cool teal dusk, warm skin.' },
];

export const LETTERINGS = [
  { id: 'chrome', name: 'Chrome Stripes', blurb: 'Sunset bands across heavy letters.' },
  { id: 'neon', name: 'Neon Glow', blurb: 'Hot pink letters that buzz.' },
  { id: 'gold', name: 'Gold Block', blurb: 'Solid gold with a dark edge.' },
  { id: 'outline', name: 'Outline Pop', blurb: 'White letters, pink outline, hard shadow.' },
];

export const QUOTES = [
  { text: 'THE COAST HAS NEVER LOOKED THIS GOOD', source: 'THE LEONIDA LEDGER' },
  { text: 'PURE GOLDEN-HOUR MAYHEM', source: 'THE HARBOR GAZETTE' },
  { text: 'THE HOTTEST RIDE OF THE YEAR', source: 'GOLDEN MILE GAZETTE' },
  { text: 'FIVE FRIENDS. ONE COAST. NO WAY BACK.', source: 'VICE CITY WEEKLY' },
  { text: 'EVERY FRAME DRIPS SUNSET', source: 'THE PALM POST' },
];

export const TITLE_IDEAS = [
  'SUNSET HEIST', 'NEON NIGHTS', 'PALM FEVER', 'SUNDOWN RACKET',
  'GOLDEN HOUR', 'VICE ROYALE', 'LAST LIGHT', 'COAST RUNNERS',
];

export const SUBTITLE_IDEAS = [
  'One Last Summer in Leonida', 'Paid in Sunsets', 'One Last Summer Job',
  'Welcome Back to the Coast', 'Ocean Avenue', 'Every Sunset Has a Price',
];

export const TAGLINE_IDEAS = [
  'EVERYONE WANTS A CUT OF THE SUNSET',
  'FIVE FRIENDS · ONE COAST · NO WAY BACK',
  'ONE COAST · NO RULES · COMING SOON',
  'STEAL THE SUNSET BEFORE IT SETS',
];

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

export function defaultState() {
  return {
    layout: 'grid',
    grade: 'sunset',
    lettering: 'chrome',
    title: 'SUNSET HEIST',
    subtitle: 'One Last Summer in Leonida',
    tagline: 'EVERYONE WANTS A CUT OF THE SUNSET',
    quote: 0,
    showStarburst: true,
    showBilling: true,
    panels: DEFAULT_PANELS.map((p) => ({ ...p })),
    selectedPanel: 0,
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function quoteOf(state) {
  return QUOTES[state.quote] ?? QUOTES[0];
}
