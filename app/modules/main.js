/* main.js — wiring. Boots the data, keeps the tab state on the URL, and forwards every click, key press
   and form change to the store before repainting. */

import { view, restore, holds, mark, flip, setMask, wipe, saveFile, loadFile } from './store.js';
import { repaint, paintRows, paintDetail, masked } from './guide.js';

const DATA_URL = new URL('../data/trophies.json', import.meta.url);
const MODES = ['checklist', 'route', 'citations'];

const byId = (id) => document.getElementById(id);

function readUrl() {
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode');
  if (MODES.includes(mode)) showMode(mode);
  const mask = params.get('mask');
  if (mask === 'off') setMask(false);
  if (mask === 'on') setMask(true);
  const open = params.get('open');
  if (open && view.data.trophies.some((t) => t.name === open)) view.open = open;
}

export function showMode(mode) {
  for (const button of byId('switch').querySelectorAll('button[data-mode]')) {
    const on = button.dataset.mode === mode;
    button.setAttribute('aria-selected', on ? 'true' : 'false');
  }
  for (const name of MODES) {
    const scene = byId(`scene-${name}`);
    if (scene) scene.hidden = name !== mode;
  }
  try {
    history.replaceState(null, '', `?mode=${mode}`);
  } catch {
    /* file:// in some browsers refuses history writes; the view still switches */
  }
}

function pick(name, scroll) {
  view.open = name;
  paintRows();
  paintDetail();
  if (scroll && byId('detail').scrollIntoView) {
    byId('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function paintMaskLabels() {
  byId('q-mask').checked = view.mask;
  byId('mask-state').textContent = view.mask ? 'On' : 'Off';
}

function wireSwitch() {
  byId('switch').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-mode]');
    if (button) showMode(button.dataset.mode);
  });
}

function wireConsole() {
  const text = byId('q-text');
  const grade = byId('q-grade');
  const family = byId('q-family');
  const statePick = byId('q-state');

  text.addEventListener('input', () => {
    view.query.text = text.value;
    paintRows();
  });
  const copy = (key) => (event) => {
    view.query[key] = event.target.value;
    paintRows();
  };
  grade.addEventListener('change', copy('grade'));
  family.addEventListener('change', copy('family'));
  statePick.addEventListener('change', copy('state'));

  byId('q-mask').addEventListener('change', (event) => {
    setMask(event.target.checked);
    paintMaskLabels();
    repaint();
  });
}

function wireProgress() {
  const importInput = byId('import');
  byId('export').addEventListener('click', () => saveFile(view.data));
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const result = await loadFile(view.data, file);
      repaint();
      byId('list-note').textContent = `Loaded ${result.kept} earned trophies${result.dropped ? `, ignored ${result.dropped} unknown name(s)` : ''}.`;
    } catch (error) {
      byId('list-note').textContent = `Could not read that file: ${error.message}`;
    } finally {
      importInput.value = '';
    }
    paintMaskLabels();
  });
  byId('reset').addEventListener('click', () => {
    if (!window.confirm('Clear every earned trophy in this browser? Save a JSON copy first if you want one.')) return;
    wipe();
    repaint();
    paintMaskLabels();
  });
}

function wireRows() {
  const list = byId('rows');
  list.addEventListener('click', (event) => {
    const row = event.target.closest('.row');
    if (!row) return;
    const trophy = view.data.trophies.find((t) => t.name === row.dataset.name);
    if (!trophy) return;
    if (event.target.matches('input[data-role="toggle"]')) {
      mark(trophy, event.target.checked);
      repaint();
      return;
    }
    pick(trophy.name, true);
  });
  list.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('.row');
    if (!row) return;
    event.preventDefault();
    pick(row.dataset.name, true);
  });
}

function wireDetail() {
  byId('detail').addEventListener('click', (event) => {
    if (!event.target.matches('[data-role="detail-flip"]')) return;
    const trophy = view.data.trophies.find((t) => t.name === view.open);
    if (!trophy) return;
    flip(trophy);
    repaint();
  });
}

function wireRoute() {
  byId('route').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-jump]');
    if (!chip) return;
    showMode('checklist');
    pick(chip.dataset.jump, true);
  });
}

async function boot() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    view.data = await response.json();
  } catch (error) {
    byId('detail').textContent = `The trophy data could not be loaded: ${error.message}`;
    return;
  }
  restore();
  const firstVisible = view.data.trophies.find((t) => !masked(t));
  if (!view.open) view.open = firstVisible ? firstVisible.name : view.data.trophies[0].name;
  paintMaskLabels();
  readUrl();
  wireSwitch();
  wireConsole();
  wireProgress();
  wireRows();
  wireDetail();
  wireRoute();
  repaint();
}

boot();
