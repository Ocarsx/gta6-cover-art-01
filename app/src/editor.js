// Cover Art Studio III — the editor: every control in the side panel, the
// undo/redo history, Surprise me, photo uploads and the PNG exports. It owns
// no pixels; it only changes the state and asks main.js to repaint.

import {
  GRADES, LAYOUTS, LETTERINGS, QUOTES, SAMPLES, ROLES,
  SUBTITLE_IDEAS, TAGLINE_IDEAS, TITLE_IDEAS, cloneState, defaultState,
} from './state.js';
import { exportCover } from './render.js';

function el(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  if (text) node.textContent = text;
  return node;
}

function option(value, label) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = label;
  return o;
}

function field(labelText, input) {
  const wrap = el('label', { class: 'field' });
  wrap.append(el('span', { class: 'field-label' }, labelText), input);
  return wrap;
}

export function initEditor(root, api) {
  const { getState, setState, images, renderPreview, status } = api;
  let history = [];
  let future = [];

  function commit(next, label) {
    history.push(cloneState(getState()));
    if (history.length > 60) history.shift();
    future = [];
    setState(next);
    renderPreview();
    refreshButtons();
    if (label) status(label);
  }

  function undo() {
    if (history.length === 0) return;
    future.push(cloneState(getState()));
    setState(history.pop());
    renderPreview();
    refreshButtons();
    status('Undid the last change.');
  }

  function redo() {
    if (future.length === 0) return;
    history.push(cloneState(getState()));
    setState(future.pop());
    renderPreview();
    refreshButtons();
    status('Redid the change.');
  }

  function surprise() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const next = cloneState(getState());
    next.layout = pick(LAYOUTS).id;
    next.grade = pick(GRADES).id;
    next.lettering = pick(LETTERINGS).id;
    next.title = pick(TITLE_IDEAS);
    next.subtitle = pick(SUBTITLE_IDEAS);
    next.tagline = pick(TAGLINE_IDEAS);
    next.quote = Math.floor(Math.random() * QUOTES.length);
    // Shuffle which sample sits in each panel, keeping every role filled.
    const shuffled = [...SAMPLES].sort(() => Math.random() - 0.5);
    next.panels.forEach((p, i) => { p.photo = shuffled[i % shuffled.length].id; });
    commit(next, `Surprise: ${next.title} in ${LAYOUTS.find((l) => l.id === next.layout).name}.`);
  }

  function resetAll() {
    commit(defaultState(), 'Back to the default Sunset Heist cover.');
  }

  // ------------------------------------------------------------ poster section
  const poster = el('section', { class: 'panel-card', id: 'poster-controls' });
  poster.append(el('h2', {}, 'Poster'));
  const layoutSel = el('select', { id: 'layout-select' });
  LAYOUTS.forEach((l) => layoutSel.append(option(l.id, l.name)));
  layoutSel.addEventListener('change', () => {
    const next = cloneState(getState());
    next.layout = layoutSel.value;
    commit(next, `Layout: ${LAYOUTS.find((l) => l.id === next.layout).name}.`);
  });
  poster.append(field('Layout', layoutSel));

  const gradeSel = el('select', { id: 'grade-select' });
  GRADES.forEach((g) => gradeSel.append(option(g.id, g.name)));
  gradeSel.addEventListener('change', () => {
    const next = cloneState(getState());
    next.grade = gradeSel.value;
    commit(next, `Grade: ${GRADES.find((g) => g.id === next.grade).name}.`);
  });
  poster.append(field('Grade', gradeSel));

  const letterSel = el('select', { id: 'lettering-select' });
  LETTERINGS.forEach((l) => letterSel.append(option(l.id, l.name)));
  letterSel.addEventListener('change', () => {
    const next = cloneState(getState());
    next.lettering = letterSel.value;
    commit(next, `Lettering: ${LETTERINGS.find((l) => l.id === next.lettering).name}.`);
  });
  poster.append(field('Lettering', letterSel));
  root.append(poster);

  // ------------------------------------------------------------ words section
  const words = el('section', { class: 'panel-card', id: 'words-controls' });
  words.append(el('h2', {}, 'Words'));
  const titleIn = el('input', { id: 'title-input', type: 'text', maxlength: '24' });
  titleIn.addEventListener('input', () => {
    const next = cloneState(getState());
    next.title = titleIn.value.toUpperCase() || 'UNTITLED';
    commit(next);
  });
  words.append(field('Title', titleIn));
  const subIn = el('input', { id: 'subtitle-input', type: 'text', maxlength: '48' });
  subIn.addEventListener('input', () => {
    const next = cloneState(getState());
    next.subtitle = subIn.value || 'One Last Summer in Leonida';
    commit(next);
  });
  words.append(field('Subtitle', subIn));
  const tagIn = el('input', { id: 'tagline-input', type: 'text', maxlength: '48' });
  tagIn.addEventListener('input', () => {
    const next = cloneState(getState());
    next.tagline = tagIn.value.toUpperCase() || 'EVERYONE WANTS A CUT';
    commit(next);
  });
  words.append(field('Tagline', tagIn));
  const quoteSel = el('select', { id: 'quote-select' });
  QUOTES.forEach((q, i) => quoteSel.append(option(String(i), `\u201C${q.text}\u201D — ${q.source}`)));
  quoteSel.addEventListener('change', () => {
    const next = cloneState(getState());
    next.quote = Number(quoteSel.value);
    commit(next, 'Press quote changed.');
  });
  words.append(field('Press quote', quoteSel));

  const starToggle = el('input', { id: 'starburst-toggle', type: 'checkbox' });
  starToggle.addEventListener('change', () => {
    const next = cloneState(getState());
    next.showStarburst = starToggle.checked;
    commit(next, next.showStarburst ? 'Starburst stamp on.' : 'Starburst stamp off.');
  });
  words.append(field('Starburst stamp', starToggle));
  const billToggle = el('input', { id: 'billing-toggle', type: 'checkbox' });
  billToggle.addEventListener('change', () => {
    const next = cloneState(getState());
    next.showBilling = billToggle.checked;
    commit(next, next.showBilling ? 'Billing block + barcode on.' : 'Billing block + barcode off.');
  });
  words.append(field('Billing block + barcode', billToggle));
  root.append(words);

  // ------------------------------------------------------------ panels section
  const panels = el('section', { class: 'panel-card', id: 'panels-controls' });
  panels.append(el('h2', { id: 'panel-editor-title' }, 'Face-safe crop — The Rider'));
  const tabs = el('div', { class: 'panel-tabs', id: 'panel-tabs' });
  ROLES.forEach((role, i) => {
    const b = el('button', { type: 'button', class: 'panel-tab', 'data-panel': String(i) }, String(i + 1));
    b.title = role;
    b.addEventListener('click', () => {
      const next = cloneState(getState());
      next.selectedPanel = i;
      setState(next);
      syncPanelEditor();
      status(`Editing panel ${i + 1}: ${role}.`);
    });
    tabs.append(b);
  });
  panels.append(tabs);

  const photoSel = el('select', { id: 'panel-photo-select' });
  SAMPLES.forEach((s) => photoSel.append(option(s.id, s.label)));
  const uploadBtn = el('button', { type: 'button', id: 'panel-upload-btn', class: 'ghost' }, 'Upload your photo…');
  const uploadIn = el('input', { id: 'panel-upload-input', type: 'file', accept: 'image/*' });
  uploadIn.style.display = 'none';
  uploadBtn.addEventListener('click', () => uploadIn.click());
  uploadIn.addEventListener('change', () => {
    const file = uploadIn.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const key = `upload-${Date.now()}`;
        images.set(key, img);
        const next = cloneState(getState());
        next.panels[next.selectedPanel].photo = key;
        commit(next, `Your photo is in panel ${next.selectedPanel + 1}.`);
        syncPanelEditor();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
  photoSel.addEventListener('change', () => {
    const next = cloneState(getState());
    next.panels[next.selectedPanel].photo = photoSel.value;
    commit(next, `Panel ${next.selectedPanel + 1} photo changed.`);
  });
  panels.append(field('Photo', photoSel), uploadBtn, uploadIn);

  const zoomIn = el('input', { id: 'panel-zoom', type: 'range', min: '1', max: '2.2', step: '0.01' });
  zoomIn.addEventListener('input', () => {
    const next = cloneState(getState());
    next.panels[next.selectedPanel].zoom = Number(zoomIn.value);
    commit(next);
  });
  panels.append(field('Zoom', zoomIn));
  const fxIn = el('input', { id: 'panel-fx', type: 'range', min: '0', max: '1', step: '0.01' });
  fxIn.addEventListener('input', () => {
    const next = cloneState(getState());
    next.panels[next.selectedPanel].fx = Number(fxIn.value);
    commit(next);
  });
  panels.append(field('Crop left ↔ right', fxIn));
  const fyIn = el('input', { id: 'panel-fy', type: 'range', min: '0', max: '1', step: '0.01' });
  fyIn.addEventListener('input', () => {
    const next = cloneState(getState());
    next.panels[next.selectedPanel].fy = Number(fyIn.value);
    commit(next);
  });
  panels.append(field('Crop up ↔ down', fyIn));

  const safeToggle = el('input', { id: 'face-safe-toggle', type: 'checkbox' });
  safeToggle.addEventListener('change', () => {
    const next = cloneState(getState());
    const p = next.panels[next.selectedPanel];
    p.faceSafe = safeToggle.checked;
    if (p.faceSafe) {
      p.fy = Math.min(Math.max(p.fy, 0.15), 0.5);
      p.zoom = Math.min(p.zoom, 1.4);
    }
    commit(next, p.faceSafe ? 'Face-safe crop on for this panel.' : 'Face-safe crop off — free crop.');
    syncPanelEditor();
  });
  panels.append(field('Face-safe crop', safeToggle));

  const fillAll = el('button', { type: 'button', id: 'fill-all-btn', class: 'ghost' }, 'Use this photo in all six panels');
  fillAll.addEventListener('click', () => {
    const next = cloneState(getState());
    const photo = next.panels[next.selectedPanel].photo;
    next.panels.forEach((p) => { p.photo = photo; });
    commit(next, 'One photo now fills all six panels.');
  });
  panels.append(fillAll);
  root.append(panels);

  function syncPanelEditor() {
    const st = getState();
    const p = st.panels[st.selectedPanel];
    document.getElementById('panel-editor-title').textContent = `Face-safe crop — ${ROLES[p.role]}`;
    tabs.querySelectorAll('.panel-tab').forEach((b, i) => b.classList.toggle('active', i === st.selectedPanel));
    // An uploaded photo is not in the sample list; keep the select on the sample it replaces.
    if ([...photoSel.options].some((o) => o.value === p.photo)) photoSel.value = p.photo;
    zoomIn.value = String(p.zoom);
    fxIn.value = String(p.fx);
    fyIn.value = String(p.fy);
    safeToggle.checked = p.faceSafe;
    layoutSel.value = st.layout;
    gradeSel.value = st.grade;
    letterSel.value = st.lettering;
    titleIn.value = st.title;
    subIn.value = st.subtitle;
    tagIn.value = st.tagline;
    quoteSel.value = String(st.quote);
    starToggle.checked = st.showStarburst;
    billToggle.checked = st.showBilling;
  }

  function refreshButtons() {
    document.getElementById('undo-btn').disabled = history.length === 0;
    document.getElementById('redo-btn').disabled = future.length === 0;
    syncPanelEditor();
  }

  document.getElementById('undo-btn').addEventListener('click', undo);
  document.getElementById('redo-btn').addEventListener('click', redo);
  document.getElementById('surprise-btn').addEventListener('click', surprise);
  document.getElementById('reset-btn').addEventListener('click', resetAll);

  // ------------------------------------------------------------ exports
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const w = Number(btn.dataset.w);
      const h = Number(btn.dataset.h);
      const canvas = exportCover(getState(), images, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sunset-heist-${w}x${h}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        status(`Exported ${w} × ${h} PNG — check your downloads.`);
      }, 'image/png');
    });
  });

  syncPanelEditor();
  refreshButtons();
  return { undo, redo, surprise, resetAll, syncPanelEditor };
}
