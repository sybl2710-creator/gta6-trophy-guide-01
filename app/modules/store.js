// store.js — the one place progress lives: a Set of trophy names, mirrored to localStorage, plus the
// plain-JSON export/import pair used to move that set between browsers.

const STORAGE_KEY = 'leonida-ledger.progress.v1';
const SPOILER_KEY = 'leonida-ledger.spoilers.v1';

export const state = {
  doc: null,
  earned: new Set(),
  spoilersOn: true,
  selected: null,
  filters: { text: '', grade: 'all', kind: 'all', status: 'all' },
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const names = raw ? JSON.parse(raw) : [];
    state.earned = new Set(Array.isArray(names) ? names.filter((n) => typeof n === 'string') : []);
  } catch {
    state.earned = new Set();
  }
  state.spoilersOn = localStorage.getItem(SPOILER_KEY) !== 'off';
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.earned]));
  } catch {
    /* private mode or a full quota: the session still works, it just will not outlive the tab */
  }
}

export function isEarned(trophy) {
  return state.earned.has(trophy.name);
}

export function setEarned(trophy, value) {
  if (value) state.earned.add(trophy.name);
  else state.earned.delete(trophy.name);
  persist();
}

export function toggleEarned(trophy) {
  setEarned(trophy, !isEarned(trophy));
  return isEarned(trophy);
}

export function setSpoilers(on) {
  state.spoilersOn = !!on;
  localStorage.setItem(SPOILER_KEY, state.spoilersOn ? 'on' : 'off');
  persist();
}

export function resetProgress() {
  state.earned.clear();
  persist();
}

export function countsByGrade(doc) {
  const base = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const earned = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of doc.trophies) {
    base[t.grade] += 1;
    if (isEarned(t)) earned[t.grade] += 1;
  }
  return { base, earned };
}

// A trophy's identity for a progress file is its name, so an import survives reordering or added guides.
export function exportPayload() {
  return {
    app: 'leonida-ledger',
    version: 1,
    game: state.doc?.game ?? 'Grand Theft Auto VI',
    savedAt: new Date().toISOString(),
    earned: state.doc ? state.doc.trophies.filter(isEarned).map((t) => t.name) : [...state.earned],
  };
}

export function importPayload(data) {
  const names = Array.isArray(data) ? data : data?.earned;
  if (!Array.isArray(names)) throw new Error('No "earned" array in this file.');
  const known = new Set((state.doc?.trophies ?? []).map((t) => t.name));
  const accepted = names.filter((n) => typeof n === 'string' && known.has(n));
  const rejected = names.length - accepted.length;
  state.earned = new Set(accepted);
  persist();
  return { accepted: accepted.length, rejected };
}

export function downloadProgress() {
  const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readProgressFile(file) {
  const text = await file.text();
  return importPayload(JSON.parse(text));
}
