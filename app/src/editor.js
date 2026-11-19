// Neon Cover Studio — editor logic: photos, panel assignment, crop and
// zoom per panel, undo history, Surprise me, and PNG export in all sizes.

import { LAYOUTS, GRADES, LETTERINGS, layoutById, defaultPanels } from './panels.js';
import { drawCover, renderCoverDataURL, renderCoverJpeg, EXPORT_SIZES } from './render.js';

const SAMPLE_PHOTOS = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
];

export const DEFAULT_STATE = {
  title: 'NEON NIGHTS',
  subtitle: 'Welcome Back to the Coast',
  tagline: 'ONE COAST • NO RULES • COMING SOON',
  quote: 'THE COAST HAS NEVER LOOKED THIS GOOD',
  layout: 'keyart',
  grade: 'neon-sunset',
  lettering: 'block',
  panels: defaultPanels('keyart'),
  extras: { stars: true, stamp: true, labels: true, vol: true, ticker: true, credits: true },
};

function cloneState(s) {
  return JSON.parse(JSON.stringify(s));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

class CoverEditor {
  constructor() {
    this.state = cloneState(DEFAULT_STATE);
    this.photos = []; // {id, name, img, src}
    this.selectedPanel = 0;
    this.history = [];
    this.future = [];
    this.drag = null;
    this.canvas = document.getElementById('previewCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async init() {
    for (const sample of SAMPLE_PHOTOS) {
      try {
        const img = await loadImage(sample.src);
        this.photos.push({ id: sample.id, name: sample.name, img, src: sample.src });
      } catch (err) {
        console.warn('sample failed to load', sample.src, err);
      }
    }
    this.buildControls();
    this.bindEvents();
    this.syncInputs();
    this.render();
    window.__cover = {
      state: () => cloneState(this.state),
      setState: (patch) => { this.pushHistory(); Object.assign(this.state, patch); this.syncInputs(); this.render(); },
      photosReady: () => this.photos.length > 0 && this.photos.every((p) => p.img && p.img.complete),
      renderJpeg: (w, h, q) => renderCoverJpeg(this.state, this.photos, w, h, q),
      renderPng: (w, h) => renderCoverDataURL(this.state, this.photos, { w, h }),
      exportSize: (id) => this.exportSize(id),
    };
    document.getElementById('statusLine').textContent =
      `${this.photos.length} photos loaded — drag a panel to reframe it`;
  }

  // ---- history ---------------------------------------------------------
  pushHistory() {
    this.history.push(cloneState(this.state));
    if (this.history.length > 60) this.history.shift();
    this.future = [];
    this.updateUndoButtons();
  }

  undo() {
    if (!this.history.length) return;
    this.future.push(cloneState(this.state));
    this.state = this.history.pop();
    this.selectedPanel = Math.min(this.selectedPanel, this.state.panels.length - 1);
    this.syncInputs();
    this.render();
    this.updateUndoButtons();
  }

  redo() {
    if (!this.future.length) return;
    this.history.push(cloneState(this.state));
    this.state = this.future.pop();
    this.syncInputs();
    this.render();
    this.updateUndoButtons();
  }

  updateUndoButtons() {
    document.getElementById('undoBtn').disabled = !this.history.length;
    document.getElementById('redoBtn').disabled = !this.future.length;
  }

  // ---- controls --------------------------------------------------------
  el(id) {
    return document.getElementById(id);
  }

  buildControls() {
    const layoutGrid = this.el('layoutGrid');
    LAYOUTS.forEach((layout) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip layout-chip';
      b.dataset.layout = layout.id;
      b.innerHTML = `<span class="chip-name">${layout.name}</span><span class="chip-sub">${layout.blurb} · ${layout.panels.length} panels</span>`;
      b.addEventListener('click', () => {
        if (this.state.layout === layout.id) return;
        this.pushHistory();
        this.state.layout = layout.id;
        this.state.panels = defaultPanels(layout.id);
        this.selectedPanel = 0;
        this.syncInputs();
        this.render();
      });
      layoutGrid.appendChild(b);
    });

    const gradeGrid = this.el('gradeGrid');
    GRADES.forEach((grade) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip grade-chip';
      b.dataset.grade = grade.id;
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = `linear-gradient(135deg, ${grade.sky[0]}, ${grade.sky[1]} 55%, ${grade.sky[2]})`;
      b.appendChild(sw);
      const label = document.createElement('span');
      label.className = 'chip-name';
      label.textContent = grade.name;
      b.appendChild(label);
      b.addEventListener('click', () => {
        if (this.state.grade === grade.id) return;
        this.pushHistory();
        this.state.grade = grade.id;
        this.syncInputs();
        this.render();
      });
      gradeGrid.appendChild(b);
    });

    const letterGrid = this.el('letteringGrid');
    LETTERINGS.forEach((style) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip letter-chip';
      b.dataset.lettering = style.id;
      b.innerHTML = `<span class="chip-name">${style.name}</span><span class="chip-sub">${style.blurb}</span>`;
      b.addEventListener('click', () => {
        if (this.state.lettering === style.id) return;
        this.pushHistory();
        this.state.lettering = style.id;
        this.syncInputs();
        this.render();
      });
      letterGrid.appendChild(b);
    });

    const extras = [
      ['stars', '★ Stars + press quote'],
      ['stamp', '✦ Starburst stamp'],
      ['labels', '▣ Panel labels'],
      ['vol', 'Vol. 1 tag'],
      ['ticker', 'Ticker band + palms'],
      ['credits', 'Credits + barcode'],
    ];
    const extrasBox = this.el('extrasBox');
    extras.forEach(([key, label]) => {
      const lab = document.createElement('label');
      lab.className = 'toggle-row';
      lab.innerHTML = `<input type="checkbox" data-extra="${key}" ${this.state.extras[key] ? 'checked' : ''}> <span>${label}</span>`;
      lab.querySelector('input').addEventListener('change', (ev) => {
        this.pushHistory();
        this.state.extras[key] = ev.target.checked;
        this.render();
      });
      extrasBox.appendChild(lab);
    });

    const exportBox = this.el('exportBox');
    EXPORT_SIZES.forEach((size) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'export-btn';
      b.textContent = `PNG ${size.name}`;
      b.addEventListener('click', () => this.exportSize(size.id));
      exportBox.appendChild(b);
    });
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'export-btn export-all';
    all.textContent = '⬇ Export all sizes';
    all.addEventListener('click', () => this.exportAll());
    exportBox.appendChild(all);
  }

  bindEvents() {
    const titleInput = this.el('titleInput');
    const subtitleInput = this.el('subtitleInput');
    const taglineInput = this.el('taglineInput');
    titleInput.addEventListener('input', () => { this.state.title = titleInput.value; this.render(); });
    subtitleInput.addEventListener('input', () => { this.state.subtitle = subtitleInput.value; this.render(); });
    taglineInput.addEventListener('input', () => { this.state.tagline = taglineInput.value; this.render(); });
    titleInput.addEventListener('change', () => this.pushHistory());
    subtitleInput.addEventListener('change', () => this.pushHistory());
    taglineInput.addEventListener('change', () => this.pushHistory());

    this.el('undoBtn').addEventListener('click', () => this.undo());
    this.el('redoBtn').addEventListener('click', () => this.redo());
    this.el('surpriseBtn').addEventListener('click', () => this.surprise());
    this.el('resetBtn').addEventListener('click', () => {
      this.pushHistory();
      this.state = cloneState(DEFAULT_STATE);
      this.selectedPanel = 0;
      this.syncInputs();
      this.render();
    });

    this.el('uploadInput').addEventListener('change', (ev) => this.handleUpload(ev));
    this.el('zoomSlider').addEventListener('input', (ev) => {
      const panel = this.state.panels[this.selectedPanel];
      if (!panel) return;
      panel.crop.zoom = parseFloat(ev.target.value);
      this.render();
    });
    this.el('zoomSlider').addEventListener('change', () => this.pushHistory());

    // Drag inside the preview to reframe the selected panel.
    this.canvas.addEventListener('pointerdown', (ev) => {
      const hit = this.panelAtEvent(ev);
      if (hit < 0) return;
      this.selectedPanel = hit;
      this.syncPanelControls();
      const panel = this.state.panels[hit];
      this.pushHistory();
      this.drag = { x: ev.clientX, y: ev.clientY, fx: panel.crop.fx, fy: panel.crop.fy };
      this.canvas.setPointerCapture(ev.pointerId);
      this.render();
    });
    this.canvas.addEventListener('pointermove', (ev) => {
      if (!this.drag) return;
      const panel = this.state.panels[this.selectedPanel];
      const rect = this.canvas.getBoundingClientRect();
      const dx = (ev.clientX - this.drag.x) / rect.width;
      const dy = (ev.clientY - this.drag.y) / rect.height;
      panel.crop.fx = Math.max(0.05, Math.min(0.95, this.drag.fx - dx * panel.w));
      panel.crop.fy = Math.max(0.05, Math.min(0.95, this.drag.fy - dy * panel.h));
      this.render();
    });
    this.canvas.addEventListener('pointerup', () => {
      this.drag = null;
    });
  }

  panelAtEvent(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const nx = (ev.clientX - rect.left) / rect.width;
    const ny = (ev.clientY - rect.top) / rect.height;
    for (let i = this.state.panels.length - 1; i >= 0; i--) {
      const p = this.state.panels[i];
      if (nx >= p.x && nx <= p.x + p.w && ny >= p.y && ny <= p.y + p.h) return i;
    }
    return -1;
  }

  async handleUpload(ev) {
    const files = [...ev.target.files].slice(0, 4);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (this.photos.length >= 6) break;
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const img = await loadImage(dataUrl);
      this.photos.push({ id: `up${Date.now()}_${this.photos.length}`, name: file.name.replace(/\.[^.]+$/, ''), img, src: dataUrl });
    }
    ev.target.value = '';
    this.pushHistory();
    this.syncPhotoLibrary();
    this.syncPanelControls();
    this.render();
  }

  // ---- syncing the UI from state ---------------------------------------
  syncInputs() {
    this.el('titleInput').value = this.state.title;
    this.el('subtitleInput').value = this.state.subtitle;
    this.el('taglineInput').value = this.state.tagline;
    document.querySelectorAll('#layoutGrid .chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === this.state.layout);
    });
    document.querySelectorAll('#gradeGrid .chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === this.state.grade);
    });
    document.querySelectorAll('#letteringGrid .chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.lettering === this.state.lettering);
    });
    document.querySelectorAll('#extrasBox input').forEach((input) => {
      input.checked = !!this.state.extras[input.dataset.extra];
    });
    this.syncPhotoLibrary();
    this.syncPanelControls();
    this.updateUndoButtons();
  }

  syncPhotoLibrary() {
    const lib = this.el('photoLibrary');
    lib.innerHTML = '';
    this.photos.forEach((photo, idx) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'thumb';
      thumb.title = `${photo.name} — click to put in the selected panel`;
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.name;
      thumb.appendChild(img);
      const cap = document.createElement('span');
      cap.textContent = photo.name;
      thumb.appendChild(cap);
      thumb.addEventListener('click', () => {
        const panel = this.state.panels[this.selectedPanel];
        if (!panel) return;
        this.pushHistory();
        panel.photo = idx;
        this.syncPanelControls();
        this.render();
      });
      lib.appendChild(thumb);
    });
    const count = this.el('photoCount');
    count.textContent = `${this.photos.length} / 6 photos`;
  }

  syncPanelControls() {
    const list = this.el('panelList');
    list.innerHTML = '';
    this.state.panels.forEach((panel, idx) => {
      const row = document.createElement('div');
      row.className = 'panel-row' + (idx === this.selectedPanel ? ' selected' : '');
      const name = document.createElement('button');
      name.type = 'button';
      name.className = 'panel-name';
      name.textContent = `Panel ${idx + 1} — ${panel.label}`;
      name.addEventListener('click', () => {
        this.selectedPanel = idx;
        this.syncPanelControls();
        this.render();
      });
      const select = document.createElement('select');
      select.setAttribute('aria-label', `Photo for panel ${idx + 1}`);
      this.photos.forEach((photo, pIdx) => {
        const opt = document.createElement('option');
        opt.value = String(pIdx);
        opt.textContent = photo.name;
        if (pIdx === panel.photo) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        this.pushHistory();
        panel.photo = parseInt(select.value, 10);
        this.render();
      });
      row.appendChild(name);
      row.appendChild(select);
      list.appendChild(row);
    });
    const panel = this.state.panels[this.selectedPanel];
    if (panel) {
      this.el('zoomSlider').value = String(panel.crop.zoom);
      this.el('zoomLabel').textContent = `Zoom ${panel.crop.zoom.toFixed(2)}× — drag the cover to reframe panel ${this.selectedPanel + 1}`;
    }
  }

  // ---- randomise ---------------------------------------------------------
  surprise() {
    this.pushHistory();
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const layout = pick(LAYOUTS);
    this.state.layout = layout.id;
    this.state.panels = defaultPanels(layout.id);
    this.state.grade = pick(GRADES).id;
    this.state.lettering = pick(LETTERINGS).id;
    // Random photo per panel, random crop per panel — never the same framing twice.
    this.state.panels.forEach((panel) => {
      panel.photo = Math.floor(Math.random() * this.photos.length);
      panel.crop = {
        fx: 0.2 + Math.random() * 0.6,
        fy: 0.2 + Math.random() * 0.6,
        zoom: 1.15 + Math.random() * 0.5,
      };
    });
    this.selectedPanel = 0;
    this.syncInputs();
    this.render();
  }

  // ---- rendering ---------------------------------------------------------
  render() {
    const size = this.el('sizeSelect').value || 'wide';
    const found = EXPORT_SIZES.find((s) => s.id === size) || EXPORT_SIZES[2];
    this.canvas.width = found.w;
    this.canvas.height = found.h;
    drawCover(this.canvas, this.state, this.photos);
    // Selection outline on the preview.
    const panel = this.state.panels[this.selectedPanel];
    if (panel) {
      const ctx = this.ctx;
      const u = Math.min(this.canvas.width, this.canvas.height) / 100;
      ctx.save();
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = Math.max(2, u * 0.5);
      ctx.setLineDash([u * 1.6, u * 1.0]);
      ctx.strokeRect(panel.x * this.canvas.width + 2, panel.y * this.canvas.height + 2,
        panel.w * this.canvas.width - 4, panel.h * this.canvas.height - 4);
      ctx.restore();
    }
    this.el('previewMeta').textContent =
      `${layoutById(this.state.layout).name} · ${this.state.panels.length} panels · preview ${found.w}×${found.h}`;
  }

  // ---- export ------------------------------------------------------------
  download(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  exportSize(id) {
    const size = EXPORT_SIZES.find((s) => s.id === id);
    if (!size) return;
    const url = renderCoverDataURL(this.state, this.photos, size);
    this.download(url, `neon-nights-cover-${size.w}x${size.h}.png`);
    this.el('statusLine').textContent = `Exported PNG ${size.w} × ${size.h}`;
  }

  exportAll() {
    EXPORT_SIZES.forEach((size, i) => {
      setTimeout(() => this.exportSize(size.id), i * 250);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const editor = new CoverEditor();
  editor.init();
  document.getElementById('sizeSelect').addEventListener('change', () => editor.render());
});
