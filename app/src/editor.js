// Wires the editor: every control on the page, the undo history, the
// Surprise me button, photo uploads, and the PNG exports.
import { CAST, GRADES, LAYOUTS, LETTERINGS, cloneState, defaultState } from './state.js';
import { drawCover, exportCover } from './render.js';

const SIZES = [
  { label: '1080 \u00D7 1080', w: 1080, h: 1080 },
  { label: '1080 \u00D7 1350', w: 1080, h: 1350 },
  { label: '1920 \u00D7 1080', w: 1920, h: 1080 },
];

const SURPRISE_TITLES = [
  ['PALM FEVER', 'One Last Summer', 'FIVE FRIENDS \u00B7 ONE COAST \u00B7 NO WAY BACK'],
  ['NEON TIDE', 'Chase the Last Light', 'EVERY SUNSET HAS A PRICE'],
  ['VELVET GETAWAY', 'Drive Fast, Shine Bright', 'THE CREW IS ALL THAT MATTERS'],
  ['MIDNIGHT COAST', 'Where the Palms Lean In', 'NO MAPS \u00B7 NO MERCY \u00B7 NO BRAKES'],
  ['GOLDEN GETAWAY', 'Steal the Sunset', 'EVERYONE WANTS A CUT OF THE SUNSET'],
];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function initEditor(canvas, loadImage) {
  const state = defaultState();
  // photos[i] is the Image drawn in panel i; uploads replace one slot.
  const photos = new Array(6).fill(null);
  let history = [cloneState(state)];
  let histAt = 0;
  let selectedPanel = 3; // the hero, so its controls show first
  const status = document.getElementById('status');

  function say(msg) {
    if (status) status.textContent = msg;
  }

  function redraw() {
    drawCover(canvas, state, photos);
  }

  function commit(label) {
    history = history.slice(0, histAt + 1);
    history.push(cloneState(state));
    histAt = history.length - 1;
    if (history.length > 60) {
      history.shift();
      histAt -= 1;
    }
    syncUndoButtons();
    if (label) say(label);
  }

  function applySnapshot(snap) {
    const keepPhotos = photos.slice();
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, cloneState(snap));
    photos.splice(0, photos.length, ...keepPhotos);
    buildPanelList();
    syncControls();
    redraw();
  }

  function undo() {
    if (histAt <= 0) return;
    histAt -= 1;
    applySnapshot(history[histAt]);
    syncUndoButtons();
    say('Undid that step.');
  }

  function redo() {
    if (histAt >= history.length - 1) return;
    histAt += 1;
    applySnapshot(history[histAt]);
    syncUndoButtons();
    say('Redid that step.');
  }

  function syncUndoButtons() {
    const u = document.getElementById('undo');
    const r = document.getElementById('redo');
    if (u) u.disabled = histAt <= 0;
    if (r) r.disabled = histAt >= history.length - 1;
  }

  // ---- option rows (layout / grade / lettering) ----
  function optionRow(hostId, items, current, onPick) {
    const host = document.getElementById(hostId);
    host.innerHTML = '';
    items.forEach((item) => {
      const b = el('button', 'chip' + (item.id === current ? ' on' : ''), item.name);
      b.type = 'button';
      b.addEventListener('click', () => {
        onPick(item.id);
        host.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
        b.classList.add('on');
      });
      host.appendChild(b);
    });
  }

  function syncControls() {
    optionRow('layouts', LAYOUTS, state.layout, (id) => { state.layout = id; commit('Layout changed.'); redraw(); });
    optionRow('grades', GRADES, state.grade, (id) => { state.grade = id; commit('Grade changed.'); redraw(); });
    optionRow('letterings', LETTERINGS, state.lettering, (id) => { state.lettering = id; commit('Lettering changed.'); redraw(); });
    const t = document.getElementById('title');
    if (t && t.value !== state.title) t.value = state.title;
    const s = document.getElementById('subtitle');
    if (s && s.value !== state.subtitle) s.value = state.subtitle;
    const g = document.getElementById('tagline');
    if (g && g.value !== state.tagline) g.value = state.tagline;
  }

  // ---- per-panel cards ----
  function buildPanelList() {
    const host = document.getElementById('panels');
    host.innerHTML = '';
    state.panels.forEach((panel, i) => {
      const card = el('div', 'panel-card' + (i === selectedPanel ? ' sel' : ''));
      card.addEventListener('click', () => {
        selectedPanel = i;
        buildPanelList();
      });
      const head = el('div', 'panel-head');
      head.appendChild(el('strong', '', `Panel ${i + 1}`));
      const member = CAST[panel.cast];
      head.appendChild(el('span', 'muted', member ? member.label : ''));
      card.appendChild(head);

      const photoRow = el('label', 'field', 'Photo');
      const sel = el('select');
      CAST.forEach((m, ci) => {
        const o = el('option', '', m.label);
        o.value = String(ci);
        if (ci === panel.cast) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', async () => {
        panel.cast = Number(sel.value);
        panel.fx = CAST[panel.cast].fx;
        panel.fy = CAST[panel.cast].fy;
        panel.label = CAST[panel.cast].label;
        photos[i] = await loadImage(CAST[panel.cast].file);
        buildPanelList();
        commit('Photo swapped.');
        redraw();
      });
      sel.addEventListener('click', (e) => e.stopPropagation());
      photoRow.appendChild(sel);
      card.appendChild(photoRow);

      const upRow = el('div', 'field');
      upRow.appendChild(el('span', '', 'Your photo'));
      const up = el('input');
      up.type = 'file';
      up.accept = 'image/*';
      up.addEventListener('change', async () => {
        const file = up.files[0];
        if (!file) return;
        photos[i] = await loadImage(URL.createObjectURL(file));
        panel.fx = 0.5;
        panel.fy = 0.4;
        commit('Your photo is in panel ' + (i + 1) + '.');
        redraw();
      });
      up.addEventListener('click', (e) => e.stopPropagation());
      upRow.appendChild(up);
      card.appendChild(upRow);

      const sliders = [
        ['Focal X', 'fx', 0.05, 0.95, 0.01],
        ['Focal Y', 'fy', 0.05, 0.95, 0.01],
        ['Zoom', 'zoom', 0.8, 2.0, 0.05],
      ];
      sliders.forEach(([label, key, min, max, step]) => {
        const row = el('label', 'field', `${label} `);
        const inp = el('input');
        inp.type = 'range';
        inp.min = min;
        inp.max = max;
        inp.step = step;
        inp.value = panel[key];
        inp.addEventListener('input', () => {
          panel[key] = Number(inp.value);
          redraw();
        });
        inp.addEventListener('change', () => commit('Crop adjusted.'));
        inp.addEventListener('click', (e) => e.stopPropagation());
        row.appendChild(inp);
        card.appendChild(row);
      });

      const labelRow = el('label', 'field', 'Name tag');
      const lin = el('input');
      lin.type = 'text';
      lin.value = panel.label;
      lin.maxLength = 24;
      lin.addEventListener('input', () => { panel.label = lin.value.toUpperCase(); redraw(); });
      lin.addEventListener('change', () => commit('Name tag edited.'));
      lin.addEventListener('click', (e) => e.stopPropagation());
      labelRow.appendChild(lin);
      card.appendChild(labelRow);
      host.appendChild(card);
    });
  }

  // ---- text fields ----
  const titleInput = document.getElementById('title');
  titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
  titleInput.addEventListener('change', () => commit('Title edited.'));
  const subInput = document.getElementById('subtitle');
  subInput.addEventListener('input', () => { state.subtitle = subInput.value; redraw(); });
  subInput.addEventListener('change', () => commit('Subtitle edited.'));
  const tagInput = document.getElementById('tagline');
  tagInput.addEventListener('input', () => { state.tagline = tagInput.value; redraw(); });
  tagInput.addEventListener('change', () => commit('Tagline edited.'));

  // ---- buttons ----
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  document.getElementById('surprise').addEventListener('click', () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    state.layout = pick(LAYOUTS).id;
    state.grade = pick(GRADES).id;
    state.lettering = pick(LETTERINGS).id;
    const [t, s, g] = pick(SURPRISE_TITLES);
    state.title = t;
    state.subtitle = s;
    state.tagline = g;
    // Shuffle the cast across the panels, hero photo stays the hero.
    const order = [0, 1, 2, 4, 5].sort(() => Math.random() - 0.5);
    const hero = state.panels[3];
    const rest = state.panels.filter((_, i) => i !== 3);
    const shuffled = rest.map((p, i) => ({
      ...p,
      cast: order[i],
      fx: CAST[order[i]].fx,
      fy: CAST[order[i]].fy,
      label: CAST[order[i]].label,
    }));
    state.panels = [shuffled[0], shuffled[1], shuffled[2], hero, shuffled[3], shuffled[4]];
    Promise.all(state.panels.map((p) => loadImage(CAST[p.cast].file))).then((imgs) => {
      imgs.forEach((img, i) => { photos[i] = img; });
      buildPanelList();
      syncControls();
      commit('Surprise! A fresh cover.');
      redraw();
    });
  });
  document.getElementById('one-photo').addEventListener('click', async () => {
    const cast = state.panels[selectedPanel].cast;
    const img = await loadImage(CAST[cast].file);
    state.panels.forEach((p, i) => {
      p.cast = cast;
      p.label = CAST[cast].label;
      photos[i] = img;
    });
    buildPanelList();
    commit('One photo fills every panel.');
    redraw();
  });
  document.getElementById('reset').addEventListener('click', () => {
    applySnapshot(defaultState());
    commit('Back to the default cover.');
    say('Reset to the default cover.');
  });

  const exportHost = document.getElementById('exports');
  SIZES.forEach(({ label, w, h }) => {
    const b = el('button', 'export-btn', `PNG ${label}`);
    b.type = 'button';
    b.addEventListener('click', async () => {
      say(`Exporting ${label}…`);
      const blob = await exportCover(state, photos, w, h);
      downloadBlob(blob, `cover-${w}x${h}.png`);
      say(`Saved cover-${w}x${h}.png`);
    });
    exportHost.appendChild(b);
  });

  // ---- first paint ----
  syncControls();
  buildPanelList();
  syncUndoButtons();
  Promise.all(CAST.map((m) => loadImage(m.file))).then((imgs) => {
    state.panels.forEach((p, i) => { photos[i] = imgs[p.cast]; });
    redraw();
    window.__shotReady = true;
  });
  redraw();
  return { state, photos, redraw, undo, redo };
}
