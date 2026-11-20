// main.js — wiring only: load the data once, hand the views their data, and route every click, key and
// input to the store. Views re-render from state; nothing here knows how a trophy is drawn.

import * as store from './store.js';
import * as guide from './guide.js';

const DOC_URL = new URL('../data/trophies.json', import.meta.url);
const VIEWS = ['tracker', 'roadmap', 'sources'];
let currentView = 'tracker';

function refresh() {
  guide.renderAll();
}

function switchView(name) {
  if (!VIEWS.includes(name)) return;
  currentView = name;
  for (const button of document.querySelectorAll('#tabs button')) {
    const active = button.dataset.view === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  }
  for (const view of VIEWS) {
    const section = document.getElementById(`view-${view}`);
    if (section) section.hidden = view !== name;
  }
  if (name === 'roadmap') guide.renderRoadmap();
  if (name === 'sources') guide.renderSources();
}

function selectTrophy(name, scroll) {
  store.state.selected = name;
  guide.renderList();
  guide.renderDetail();
  if (scroll) {
    const panel = document.getElementById('detail');
    if (panel && window.matchMedia('(max-width: 980px)').matches) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function bindFilters() {
  const text = document.getElementById('filter-text');
  const grade = document.getElementById('filter-grade');
  const kind = document.getElementById('filter-kind');
  const status = document.getElementById('filter-status');
  text.addEventListener('input', () => {
    store.state.filters.text = text.value;
    guide.renderList();
  });
  grade.addEventListener('change', () => {
    store.state.filters.grade = grade.value;
    guide.renderList();
  });
  kind.addEventListener('change', () => {
    store.state.filters.kind = kind.value;
    guide.renderList();
  });
  status.addEventListener('change', () => {
    store.state.filters.status = status.value;
    guide.renderList();
  });
}

function bindSpoilers() {
  const toggle = document.getElementById('spoiler-toggle');
  const note = document.getElementById('spoiler-note');
  const paint = () => {
    toggle.checked = store.state.spoilersOn;
    note.textContent = store.state.spoilersOn ? 'Story trophies hidden' : 'Spoilers visible';
  };
  paint();
  toggle.addEventListener('change', () => {
    store.setSpoilers(toggle.checked);
    paint();
    refresh();
  });
}

function bindProgressFile() {
  const importInput = document.getElementById('import-input');
  document.getElementById('export-btn').addEventListener('click', () => store.downloadProgress());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const result = await store.readProgressFile(file);
      refresh();
      document.getElementById('list-note').textContent =
        `Imported ${result.accepted} earned trophies${result.rejected ? `, skipped ${result.rejected} unknown` : ''}.`;
    } catch (error) {
      document.getElementById('list-note').textContent = `Import failed: ${error.message}`;
    } finally {
      importInput.value = '';
    }
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    const ok = window.confirm('Clear every earned trophy in this browser? Export first if you want a backup.');
    if (!ok) return;
    store.resetProgress();
    refresh();
  });
}

function bindList() {
  const list = document.getElementById('trophy-list');
  list.addEventListener('click', (event) => {
    const row = event.target.closest('.trophy-row');
    if (!row) return;
    const trophy = store.state.doc.trophies.find((t) => t.name === row.dataset.name);
    if (!trophy) return;
    if (event.target.matches('input[type="checkbox"]')) {
      store.setEarned(trophy, event.target.checked);
      refresh();
      return;
    }
    selectTrophy(trophy.name, true);
  });
  list.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('.trophy-row');
    if (!row) return;
    event.preventDefault();
    selectTrophy(row.dataset.name, true);
  });
}

function bindDetail() {
  document.getElementById('detail').addEventListener('click', (event) => {
    if (!event.target.matches('[data-action="detail-toggle"]')) return;
    const trophy = store.state.doc.trophies.find((t) => t.name === store.state.selected);
    if (!trophy) return;
    store.toggleEarned(trophy);
    refresh();
  });
}

function bindTabs() {
  document.getElementById('tabs').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (button) switchView(button.dataset.view);
  });
  document.getElementById('roadmap').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-goto]');
    if (!chip) return;
    switchView('tracker');
    selectTrophy(chip.dataset.goto, true);
  });
}

async function boot() {
  try {
    const response = await fetch(DOC_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    store.state.doc = await response.json();
  } catch (error) {
    document.getElementById('detail').textContent = `Could not load the trophy data: ${error.message}`;
    return;
  }
  store.loadProgress();
  const first = store.state.doc.trophies.find((t) => !guide.isHiddenBySpoilers(t));
  store.state.selected = first ? first.name : null;
  bindFilters();
  bindSpoilers();
  bindProgressFile();
  bindList();
  bindDetail();
  bindTabs();
  switchView('tracker');
  refresh();
}

boot();
