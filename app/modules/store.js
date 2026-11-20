/* store.js — everything that remembers. Keeps the earned set in localStorage, hands out the export file
   and reads one back. Nothing in here touches the DOM beyond the download click. */

const EARN_KEY = 'fiftysix-stars/earned';
const MASK_KEY = 'fiftysix-stars/mask';

export const view = {
  data: null,
  marked: new Set(),
  mask: true,
  open: null,
  query: { text: '', grade: 'any', family: 'any', state: 'any' },
};

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked or full — the tab still works, it just forgets on reload */
  }
};

export function restore() {
  const saved = readJSON(EARN_KEY);
  view.marked = new Set(Array.isArray(saved) ? saved.filter((n) => typeof n === 'string') : []);
  view.mask = readJSON(MASK_KEY) !== false;
}

function commit() {
  writeJSON(EARN_KEY, [...view.marked]);
}

export const holds = (trophy) => view.marked.has(trophy.name);

export function mark(trophy, on) {
  if (on) view.marked.add(trophy.name);
  else view.marked.delete(trophy.name);
  commit();
  return holds(trophy);
}

export const flip = (trophy) => mark(trophy, !holds(trophy));

export function setMask(on) {
  view.mask = !!on;
  writeJSON(MASK_KEY, view.mask);
}

export function wipe() {
  view.marked.clear();
  commit();
}

export function tallyByGrade(data) {
  const rows = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of data.trophies) {
    const slot = rows[t.grade] ?? (rows[t.grade] = [0, 0]);
    slot[1] += 1;
    if (holds(t)) slot[0] += 1;
  }
  return rows;
}

export const earnedCount = (data) => data.trophies.filter(holds).length;

/* Progress files key on the trophy name, so a file still loads if the list is reordered later. */
export function buildPayload(data) {
  return {
    tracker: '56-stars',
    schema: 2,
    game: data?.game ?? 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: data ? data.trophies.filter(holds).map((t) => t.name) : [...view.marked],
  };
}

export function applyPayload(data, blob) {
  const names = Array.isArray(blob) ? blob : blob?.earned;
  if (!Array.isArray(names)) throw new Error('That file has no "earned" list.');
  const catalogue = new Set((data?.trophies ?? []).map((t) => t.name));
  const keep = names.filter((n) => typeof n === 'string' && catalogue.has(n));
  view.marked = new Set(keep);
  commit();
  return { kept: keep.length, dropped: names.length - keep.length };
}

export function saveFile(data) {
  const body = JSON.stringify(buildPayload(data), null, 2);
  const href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = href;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1500);
}

export async function loadFile(data, file) {
  return applyPayload(data, JSON.parse(await file.text()));
}
