// The Neon Cover Studio editor.
//
// Owns the page state — loaded photos, which photo fills which panel and
// how it is framed there, the chosen layout, the grade strength and the
// captions — and keeps the preview canvas repainted after every change.
// Photos never leave the device: files are read through object URLs and
// the bundled samples load from the app folder itself.

import { LAYOUTS, getLayout, pointInPolygon, polygonBounds } from './panels.js';
import { renderCoverArt } from './render.js';

const EXPORT_SIZES = [
  { id: 'square', label: 'Square post', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait post', width: 1080, height: 1350 },
  { id: 'wide', label: 'Wide banner', width: 1920, height: 1080 },
];

const els = {
  canvas: document.getElementById('previewCanvas'),
  photoInput: document.getElementById('photoInput'),
  sampleBoulevard: document.getElementById('sampleBoulevard'),
  samplePier: document.getElementById('samplePier'),
  photoStrip: document.getElementById('photoStrip'),
  panelList: document.getElementById('panelList'),
  zoom: document.getElementById('zoomRange'),
  offsetX: document.getElementById('offsetXRange'),
  offsetY: document.getElementById('offsetYRange'),
  grade: document.getElementById('gradeRange'),
  title: document.getElementById('titleInput'),
  subtitle: document.getElementById('subtitleInput'),
  layoutRow: document.getElementById('layoutRow'),
  sizeRow: document.getElementById('sizeRow'),
  exportButton: document.getElementById('exportButton'),
  status: document.getElementById('statusLine'),
  stage: document.getElementById('stage'),
  selectedName: document.getElementById('selectedPanelName'),
};

const state = {
  layoutId: 'poster',
  photos: [], // { id, name, img, thumbUrl }
  panelShots: [], // per panel: { photoId, zoom, offsetX, offsetY }
  selectedPanel: 0,
  title: 'NEON NIGHTS',
  subtitle: 'welcome back to the coast',
  grade: 0.8,
  exportSizeId: 'portrait',
  photoSeq: 0,
};

function exportSize() {
  return EXPORT_SIZES.find((s) => s.id === state.exportSizeId) ?? EXPORT_SIZES[0];
}

function photoById(id) {
  return state.photos.find((p) => p.id === id) ?? null;
}

/** The render-ready state: panel shots resolved to actual images. */
function renderState(showSelection) {
  return {
    layoutId: state.layoutId,
    panelShots: state.panelShots.map((shot) => ({
      image: photoById(shot.photoId)?.img ?? null,
      zoom: shot.zoom,
      offsetX: shot.offsetX,
      offsetY: shot.offsetY,
    })),
    selectedPanel: state.selectedPanel,
    showSelection,
    title: state.title,
    subtitle: state.subtitle,
    grade: state.grade,
  };
}

/** Repaints the preview canvas at the chosen export size. */
export function redrawPreview() {
  const { width, height } = exportSize();
  if (els.canvas.width !== width) els.canvas.width = width;
  if (els.canvas.height !== height) els.canvas.height = height;
  const ctx = els.canvas.getContext('2d');
  renderCoverArt(ctx, width, height, renderState(true));
}

function setStatus(message) {
  els.status.textContent = message;
}

/** Loads an image element from a URL, resolving once it can be drawn. */
function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = url;
  });
}

/** Registers a loaded image as a usable photo and returns its record. */
function registerPhoto(name, img, thumbUrl) {
  state.photoSeq += 1;
  const photo = { id: `photo-${state.photoSeq}`, name, img, thumbUrl };
  state.photos.push(photo);
  return photo;
}

/** Loads one of the bundled sample photos by its short name. */
export async function useSamplePhoto(which) {
  const existing = state.photos.find((p) => p.id === `sample-${which}`);
  if (existing) return existing;
  const url = `samples/${which}.jpg`;
  const img = await loadImageElement(url);
  state.photoSeq += 1;
  const photo = { id: `sample-${which}`, name: which === 'pier' ? 'Pier sample' : 'Boulevard sample', img, thumbUrl: url };
  state.photos.push(photo);
  return photo;
}

/** Adds user files as photos, framing the emptiest panels with them. */
async function addPhotoFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (list.length === 0) return;
  for (const file of list) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImageElement(url);
      const photo = registerPhoto(file.name.replace(/\.[^.]+$/, ''), img, url);
      const empty = state.panelShots.findIndex((s) => !s.photoId);
      const target = empty >= 0 ? empty : state.selectedPanel;
      state.panelShots[target] = { ...state.panelShots[target], photoId: photo.id };
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  syncPanelList();
  syncPhotoStrip();
  redrawPreview();
  setStatus(`${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} ready. Click a panel, then frame it with the sliders.`);
}

/** Rebuilds the per-panel shot list for a layout, keeping earlier choices. */
function rebuildPanelShots(layoutId) {
  const layout = getLayout(layoutId);
  const previous = state.panelShots;
  state.panelShots = layout.panels.map((panel, index) => {
    if (previous[index]) return previous[index];
    const fallback = state.photos[index % Math.max(state.photos.length, 1)];
    return { photoId: fallback?.id ?? null, zoom: 1, offsetX: 0, offsetY: 0 };
  });
  if (state.selectedPanel >= state.panelShots.length) state.selectedPanel = 0;
}

/** Switches the layout, preserving photos and framing where panels line up. */
export function setLayout(layoutId) {
  state.layoutId = layoutId;
  rebuildPanelShots(layoutId);
  syncLayoutButtons();
  syncPanelList();
  syncSliders();
  redrawPreview();
}

/** Renders the cover at an arbitrary size onto a fresh canvas. */
export function renderExportCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  renderCoverArt(canvas.getContext('2d'), width, height, renderState(false));
  return canvas;
}

/** Downloads the current cover as a PNG at the chosen export size. */
function exportPng() {
  const { width, height } = exportSize();
  const canvas = renderExportCanvas(width, height);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-cover-${width}x${height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(`Saved neon-cover-${width}x${height}.png — ready to post.`);
  }, 'image/png');
}

// ---------------------------------------------------------------- UI sync

function syncLayoutButtons() {
  els.layoutRow.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.layout === state.layoutId);
    btn.setAttribute('aria-pressed', String(btn.dataset.layout === state.layoutId));
  });
}

function syncSizeButtons() {
  els.sizeRow.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === state.exportSizeId);
    btn.setAttribute('aria-pressed', String(btn.dataset.size === state.exportSizeId));
  });
}

function syncPhotoStrip() {
  els.photoStrip.replaceChildren();
  for (const photo of state.photos) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'photo-chip';
    chip.title = `Use ${photo.name} in the selected panel`;
    const thumb = document.createElement('img');
    thumb.src = photo.thumbUrl;
    thumb.alt = '';
    const label = document.createElement('span');
    label.textContent = photo.name;
    chip.append(thumb, label);
    chip.addEventListener('click', () => {
      const shot = state.panelShots[state.selectedPanel];
      if (shot) shot.photoId = photo.id;
      syncPanelList();
      redrawPreview();
    });
    els.photoStrip.append(chip);
  }
}

function syncPanelList() {
  const layout = getLayout(state.layoutId);
  els.panelList.replaceChildren();
  layout.panels.forEach((panel, index) => {
    const shot = state.panelShots[index];
    const row = document.createElement('div');
    row.className = 'panel-row';
    if (index === state.selectedPanel) row.classList.add('selected');

    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'panel-pick';
    pick.textContent = `${index + 1} · ${panel.label}`;
    pick.addEventListener('click', () => selectPanel(index));

    const select = document.createElement('select');
    select.setAttribute('aria-label', `Photo for ${panel.label}`);
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No photo';
    select.append(none);
    for (const photo of state.photos) {
      const opt = document.createElement('option');
      opt.value = photo.id;
      opt.textContent = photo.name;
      select.append(opt);
    }
    select.value = shot?.photoId ?? '';
    select.addEventListener('change', () => {
      state.panelShots[index] = { ...state.panelShots[index], photoId: select.value || null };
      selectPanel(index);
      redrawPreview();
    });

    row.append(pick, select);
    els.panelList.append(row);
  });
  els.selectedName.textContent = layout.panels[state.selectedPanel]?.label ?? '';
}

function syncSliders() {
  const shot = state.panelShots[state.selectedPanel];
  if (!shot) return;
  els.zoom.value = String(Math.round(shot.zoom * 100));
  els.offsetX.value = String(Math.round(shot.offsetX * 100));
  els.offsetY.value = String(Math.round(shot.offsetY * 100));
}

function selectPanel(index) {
  state.selectedPanel = index;
  syncPanelList();
  syncSliders();
  redrawPreview();
}

// ---------------------------------------------------------------- events

function buildLayoutButtons() {
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.layout = layout.id;
    btn.innerHTML = '';
    const name = document.createElement('strong');
    name.textContent = layout.name;
    const blurb = document.createElement('small');
    blurb.textContent = layout.blurb;
    btn.append(name, blurb);
    btn.addEventListener('click', () => setLayout(layout.id));
    els.layoutRow.append(btn);
  }
}

function buildSizeButtons() {
  for (const size of EXPORT_SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.size = size.id;
    btn.textContent = `${size.label} · ${size.width}×${size.height}`;
    btn.addEventListener('click', () => {
      state.exportSizeId = size.id;
      syncSizeButtons();
      redrawPreview();
    });
    els.sizeRow.append(btn);
  }
}

function bindControls() {
  els.photoInput.addEventListener('change', () => {
    addPhotoFiles(els.photoInput.files ?? []);
    els.photoInput.value = '';
  });
  els.sampleBoulevard.addEventListener('click', async () => {
    const photo = await useSamplePhoto('boulevard');
    const shot = state.panelShots[state.selectedPanel];
    if (shot) shot.photoId = photo.id;
    syncPhotoStrip();
    syncPanelList();
    redrawPreview();
    setStatus('Boulevard sample placed in the selected panel.');
  });
  els.samplePier.addEventListener('click', async () => {
    const photo = await useSamplePhoto('pier');
    const shot = state.panelShots[state.selectedPanel];
    if (shot) shot.photoId = photo.id;
    syncPhotoStrip();
    syncPanelList();
    redrawPreview();
    setStatus('Pier sample placed in the selected panel.');
  });

  const bindShotSlider = (input, apply) => {
    input.addEventListener('input', () => {
      const shot = state.panelShots[state.selectedPanel];
      if (!shot) return;
      apply(shot, Number(input.value) / 100);
      redrawPreview();
    });
  };
  bindShotSlider(els.zoom, (shot, v) => { shot.zoom = Math.max(0.4, v); });
  bindShotSlider(els.offsetX, (shot, v) => { shot.offsetX = v; });
  bindShotSlider(els.offsetY, (shot, v) => { shot.offsetY = v; });
  els.grade.addEventListener('input', () => {
    state.grade = Number(els.grade.value) / 100;
    redrawPreview();
  });
  els.title.addEventListener('input', () => {
    state.title = els.title.value;
    redrawPreview();
  });
  els.subtitle.addEventListener('input', () => {
    state.subtitle = els.subtitle.value;
    redrawPreview();
  });
  els.exportButton.addEventListener('click', exportPng);

  els.stage.addEventListener('dragover', (event) => {
    event.preventDefault();
    els.stage.classList.add('dragging');
  });
  els.stage.addEventListener('dragleave', () => els.stage.classList.remove('dragging'));
  els.stage.addEventListener('drop', (event) => {
    event.preventDefault();
    els.stage.classList.remove('dragging');
    if (event.dataTransfer) addPhotoFiles(event.dataTransfer.files);
  });

  // Click a panel on the canvas to select it; drag to reframe its photo.
  let drag = null;
  const canvasPoint = (event) => {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };
  els.canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const layout = getLayout(state.layoutId);
    const hit = layout.panels.findIndex((panel) => pointInPolygon(point.x, point.y, panel.points));
    if (hit < 0) return;
    if (hit !== state.selectedPanel) selectPanel(hit);
    drag = { x: point.x, y: point.y };
    els.canvas.setPointerCapture(event.pointerId);
  });
  els.canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const point = canvasPoint(event);
    const layout = getLayout(state.layoutId);
    const bounds = polygonBounds(layout.panels[state.selectedPanel].points);
    const shot = state.panelShots[state.selectedPanel];
    if (shot && bounds.width > 0 && bounds.height > 0) {
      shot.offsetX = Math.max(-0.6, Math.min(0.6, shot.offsetX + (point.x - drag.x) / bounds.width));
      shot.offsetY = Math.max(-0.6, Math.min(0.6, shot.offsetY + (point.y - drag.y) / bounds.height));
      syncSliders();
      redrawPreview();
    }
    drag = point;
  });
  const endDrag = () => { drag = null; };
  els.canvas.addEventListener('pointerup', endDrag);
  els.canvas.addEventListener('pointercancel', endDrag);
}

// ---------------------------------------------------------------- start

async function start() {
  buildLayoutButtons();
  buildSizeButtons();
  bindControls();
  els.grade.value = String(Math.round(state.grade * 100));
  els.title.value = state.title;
  els.subtitle.value = state.subtitle;

  const boulevard = await useSamplePhoto('boulevard');
  const pier = await useSamplePhoto('pier');
  rebuildPanelShots(state.layoutId);
  // Open on a full poster: alternate the two samples across the panels.
  state.panelShots = state.panelShots.map((shot, index) => ({
    ...shot,
    photoId: index % 2 === 0 ? boulevard.id : pier.id,
  }));
  syncLayoutButtons();
  syncSizeButtons();
  syncPhotoStrip();
  syncPanelList();
  syncSliders();
  redrawPreview();
  setStatus('Samples loaded. Add your own photos, click any panel, and export when it sings.');
  window.__neonReady = true;
}

// A small handle for automated checks and screenshot tooling.
window.__neonStudio = {
  state,
  setLayout,
  useSamplePhoto,
  renderExportCanvas,
  redrawPreview,
  setTitle(value) { state.title = value; els.title.value = value; redrawPreview(); },
  setSubtitle(value) { state.subtitle = value; els.subtitle.value = value; redrawPreview(); },
  setGrade(value) { state.grade = value; els.grade.value = String(Math.round(value * 100)); redrawPreview(); },
  setExportSize(id) { state.exportSizeId = id; syncSizeButtons(); redrawPreview(); },
  setPanelShot(index, patch) {
    if (!state.panelShots[index]) return;
    Object.assign(state.panelShots[index], patch);
    syncPanelList();
    syncSliders();
    redrawPreview();
  },
  exportDataURL(width, height, type = 'image/png', quality = 0.92) {
    return renderExportCanvas(width, height).toDataURL(type, quality);
  },
};

start();
