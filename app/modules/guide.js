// guide.js — the read-only half of the app: the trophy list with its filters, the detail panel with per-step
// citations, the roadmap view and the source matrix. It renders; it never decides what is earned.

import { state, isEarned, countsByGrade } from './store.js';

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const KIND_LABEL = {
  story: 'Story',
  collectible: 'Collectibles',
  activity: 'Activities',
  stranger: 'Strangers & Freaks',
  robbery: 'Robberies',
  freeplay: 'Free-roam',
  online: 'Online',
};

const byId = (id) => document.getElementById(id);

export function sourceMap(doc) {
  return new Map(doc.sources.map((s) => [s.id, s]));
}

export function stepSources(trophy) {
  return [...new Set(trophy.steps.flatMap((s) => s.srcs))];
}

export function isHiddenBySpoilers(trophy) {
  return state.spoilersOn && trophy.kind === 'story' && !isEarned(trophy);
}

export function visibleTrophies() {
  const f = state.filters;
  const text = f.text.trim().toLowerCase();
  return state.doc.trophies.filter((t) => {
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.kind !== 'all' && t.kind !== f.kind) return false;
    if (f.status === 'earned' && !isEarned(t)) return false;
    if (f.status === 'missing' && isEarned(t)) return false;
    if (!text) return true;
    const hay = [t.name, t.description, t.guide, KIND_LABEL[t.kind] ?? t.kind, t.stage].join(' ').toLowerCase();
    return hay.includes(text);
  });
}

export function renderHeaderStats(doc) {
  const steps = doc.trophies.reduce((n, t) => n + t.steps.length, 0);
  const links = doc.trophies.reduce((n, t) => n + t.steps.reduce((m, s) => m + s.srcs.length, 0), 0);
  byId('stat-trophies').textContent = String(doc.trophies.length);
  byId('stat-cited').textContent = `${steps}`;
  byId('stat-cited').title = `${links} source links across ${steps} steps`;
  byId('stat-sources').textContent = String(doc.sources.length);
  byId('stat-earned').textContent = String(doc.trophies.filter(isEarned).length);
}

export function renderProgress(doc) {
  const total = doc.trophies.length;
  const done = doc.trophies.filter(isEarned).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  byId('progress-line').innerHTML = `<b>${done}</b> of ${total} earned`;
  byId('progress-pct').textContent = `${pct}%`;
  byId('progress-fill').style.width = `${pct}%`;
  const { base, earned } = countsByGrade(doc);
  const list = byId('grade-counts');
  list.replaceChildren();
  for (const grade of GRADE_ORDER) {
    const li = document.createElement('li');
    li.innerHTML = `<b>${earned[grade]}</b>/${base[grade]} ${grade}`;
    list.append(li);
  }
  const missables = doc.trophies.filter((t) => t.missable).length;
  const li = document.createElement('li');
  li.innerHTML = `<b>${missables}</b> missable`;
  list.append(li);
  byId('stat-earned').textContent = String(done);
}

export function renderList() {
  const list = byId('trophy-list');
  const rows = visibleTrophies();
  list.replaceChildren();
  byId('list-note').textContent = `${rows.length} of ${state.doc.trophies.length} trophies shown${state.spoilersOn ? ' · story names hidden until earned' : ''}`;
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'empty-note';
    li.textContent = 'Nothing matches these filters. Loosen one to see trophies again.';
    list.append(li);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const t of rows) {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'trophy-row';
    if (isEarned(t)) row.classList.add('earned');
    if (state.selected === t.name) row.classList.add('selected');
    row.dataset.name = t.name;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.dataset.action = 'toggle';
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    row.append(box);

    const badge = document.createElement('span');
    badge.className = `badge ${t.grade}`;
    badge.textContent = t.grade[0].toUpperCase();
    badge.title = `${t.grade} · ${KIND_LABEL[t.kind] ?? t.kind}`;
    row.append(badge);

    const text = document.createElement('span');
    const name = document.createElement('span');
    name.className = 't-name';
    name.textContent = isHiddenBySpoilers(t) ? 'Hidden story trophy' : t.name;
    const sub = document.createElement('span');
    sub.className = 't-sub';
    sub.textContent = isHiddenBySpoilers(t)
      ? 'Turn spoilers off to read its name and description'
      : `${KIND_LABEL[t.kind] ?? t.kind} · ${t.steps.length} cited steps`;
    text.append(name, sub);
    row.append(text);

    const pips = document.createElement('span');
    pips.className = 'pips';
    pips.setAttribute('aria-hidden', 'true');
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'badge missable';
      m.textContent = 'missable';
      pips.append(m);
    } else {
      const off = t.steps.filter((s) => s.srcs.length === 0).length;
      for (let i = 0; i < Math.min(3, t.steps.length); i += 1) {
        const pip = document.createElement('span');
        pip.className = off > i ? 'pip' : 'pip on';
        pips.append(pip);
      }
    }
    row.append(pips);
    li.append(row);
    frag.append(li);
  }
  list.append(frag);
}

function srcLinks(ids, sources) {
  const wrap = document.createElement('span');
  wrap.className = 'step-srcs';
  for (const id of ids) {
    const s = sources.get(id);
    if (!s) continue;
    const a = document.createElement('a');
    a.className = 'src';
    a.href = s.url;
    a.rel = 'noreferrer noopener';
    a.referrerPolicy = 'no-referrer';
    a.target = '_blank';
    a.textContent = s.name.replace(/ — .*/, '');
    a.title = s.url;
    wrap.append(a);
  }
  return wrap;
}

export function renderDetail() {
  const panel = byId('detail');
  const doc = state.doc;
  const sources = sourceMap(doc);
  const t = doc.trophies.find((x) => x.name === state.selected);
  panel.replaceChildren();
  if (!t) {
    const empty = document.createElement('div');
    empty.className = 'detail-empty';
    empty.innerHTML = '<h2>Pick a trophy</h2><p>Its guide, missable warning and cited steps appear here. Every claim names the page it came from.</p>';
    panel.append(empty);
    return;
  }
  const head = document.createElement('div');
  head.className = 'detail-head';
  const grade = document.createElement('span');
  grade.className = `badge ${t.grade}`;
  grade.textContent = t.grade;
  head.append(grade);
  const kind = document.createElement('span');
  kind.className = 'badge hidden';
  kind.textContent = KIND_LABEL[t.kind] ?? t.kind;
  head.append(kind);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'badge missable';
    m.textContent = 'missable';
    head.append(m);
  }
  if (t.hidden) {
    const h = document.createElement('span');
    h.className = 'badge hidden';
    h.textContent = 'hidden on PSN';
    head.append(h);
  }
  const title = document.createElement('h2');
  title.textContent = isHiddenBySpoilers(t) ? 'Hidden story trophy' : t.name;
  head.append(title);
  panel.append(head);

  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = isHiddenBySpoilers(t) ? 'Description hidden by the spoiler setting.' : t.description;
  panel.append(desc);

  const meta = document.createElement('ul');
  meta.className = 'detail-meta';
  const stage = doc.stages.find((s) => s.id === t.stage);
  for (const line of [stage ? `Stage: ${stage.title}` : 'Stage: free-roam', `${t.steps.length} cited steps`, `${stepSources(t).length} sources`]) {
    const li = document.createElement('li');
    li.textContent = line;
    meta.append(li);
  }
  panel.append(meta);

  if (!isHiddenBySpoilers(t)) {
    const guide = document.createElement('p');
    guide.className = 'detail-guide';
    guide.textContent = t.guide;
    panel.append(guide);

    if (t.missable) {
      const warn = document.createElement('p');
      warn.className = 'warn';
      warn.textContent = 'Missable: this trophy has a step that can be lost for good. Read the first step before you move on to the next chapter.';
      panel.append(warn);
    }

    const stepsTitle = document.createElement('h3');
    stepsTitle.className = 'steps-title';
    stepsTitle.textContent = 'How to get it, with sources';
    panel.append(stepsTitle);

    const ol = document.createElement('ol');
    ol.className = 'steps';
    t.steps.forEach((step, i) => {
      const li = document.createElement('li');
      const p = document.createElement('p');
      p.className = 'step-text';
      p.textContent = `${i + 1}. ${step.text}`;
      li.append(p, srcLinks(step.srcs, sources));
      ol.append(li);
    });
    panel.append(ol);
  }

  const actions = document.createElement('div');
  actions.className = 'trophy-actions';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = isEarned(t) ? 'earn on' : 'earn';
  btn.dataset.action = 'detail-toggle';
  btn.textContent = isEarned(t) ? 'Earned — undo' : 'Mark earned';
  actions.append(btn);
  panel.append(actions);
}

export function renderRoadmap() {
  const doc = state.doc;
  const ol = byId('roadmap');
  ol.replaceChildren();
  const total = doc.trophies.length;
  const done = doc.trophies.filter(isEarned).length;
  const missables = doc.trophies.filter((t) => t.missable);
  byId('roadmap-summary').textContent =
    `${total} trophies in ${doc.stages.length} stages. ${done} earned. ${missables.length} missable: ${missables.map((t) => t.name).join(', ')}.`;

  for (const stage of doc.stages) {
    const items = doc.trophies.filter((t) => t.stage === stage.id);
    const doneHere = items.filter(isEarned).length;
    const li = document.createElement('li');
    li.className = 'stage';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const h3 = document.createElement('h3');
    h3.textContent = stage.title;
    const when = document.createElement('span');
    when.className = 'stage-when';
    when.textContent = stage.when;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${doneHere}/${items.length} earned · ${stage.counts}`;
    head.append(h3, when, count);
    li.append(head);

    const body = document.createElement('p');
    body.className = 'stage-body';
    body.textContent = stage.body;
    li.append(body);

    const srcLine = document.createElement('p');
    srcLine.className = 'step-srcs';
    const sources = sourceMap(doc);
    for (const id of stage.srcs) {
      const s = sources.get(id);
      if (!s) continue;
      const a = document.createElement('a');
      a.className = 'src';
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      a.referrerPolicy = 'no-referrer';
      a.textContent = s.name.replace(/ — .*/, '');
      srcLine.append(a);
    }
    li.append(srcLine);

    const ul = document.createElement('ul');
    ul.className = 'stage-trophies';
    for (const t of items) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      if (isEarned(t)) chip.classList.add('done');
      if (t.missable) chip.classList.add('missable');
      chip.dataset.goto = t.name;
      chip.title = t.missable ? `${t.name} — missable` : t.name;
      chip.textContent = t.missable ? `${t.name} ⚑` : t.name;
      ul.append(chip);
    }
    if (!items.length) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = 'no trophies pinned here';
      ul.append(chip);
    }
    li.append(ul);
    ol.append(li);
  }
}

export function renderSources() {
  const doc = state.doc;
  const list = byId('source-list');
  const sources = sourceMap(doc);
  const usage = new Map(doc.sources.map((s) => [s.id, { trophies: new Set(), steps: 0 }]));
  let links = 0;
  let multi = 0;
  for (const t of doc.trophies) {
    const ids = stepSources(t);
    if (ids.length >= 2) multi += 1;
    for (const s of t.steps) {
      for (const id of s.srcs) {
        usage.get(id).steps += 1;
        usage.get(id).trophies.add(t.name);
        links += 1;
      }
    }
  }
  const steps = doc.trophies.reduce((n, t) => n + t.steps.length, 0);
  byId('sources-summary').textContent =
    `${doc.trophies.length} trophies · ${steps} cited steps · ${links} source links · ${doc.sources.length} sources · ${multi} trophies backed by two or more. Names, descriptions and grades come from the official PlayStation list; every step names the page it was checked against.`;

  list.replaceChildren();
  for (const s of doc.sources) {
    const card = document.createElement('div');
    card.className = 'source-card';
    const h3 = document.createElement('h3');
    h3.textContent = s.name;
    const url = document.createElement('a');
    url.className = 'src-url';
    url.href = s.url;
    url.target = '_blank';
    url.rel = 'noreferrer noopener';
    url.referrerPolicy = 'no-referrer';
    url.textContent = s.url;
    const meta = document.createElement('p');
    meta.className = 'src-meta';
    const u = usage.get(s.id);
    meta.textContent = `${u.steps} citations across ${u.trophies.size} trophies. ${s.note}`;
    card.append(h3, url, meta);
    list.append(card);
  }

  const tbody = byId('matrix').querySelector('tbody');
  tbody.replaceChildren();
  for (const t of doc.trophies) {
    const tr = document.createElement('tr');
    const name = document.createElement('td');
    name.textContent = isHiddenBySpoilers(t) ? 'Hidden story trophy' : t.name;
    const stepsTd = document.createElement('td');
    stepsTd.className = 'num';
    stepsTd.textContent = String(t.steps.length);
    const srcTd = document.createElement('td');
    const ids = stepSources(t);
    if (ids.length) {
      for (const id of ids) {
        const s = sources.get(id);
        if (!s) continue;
        const a = document.createElement('a');
        a.className = 'src';
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noreferrer noopener';
        a.referrerPolicy = 'no-referrer';
        a.textContent = s.name.split(' — ')[0];
        srcTd.append(a);
      }
    } else {
      srcTd.textContent = 'official description only';
    }
    tr.append(name, stepsTd, srcTd);
    tbody.append(tr);
  }
}

export function renderAll() {
  renderHeaderStats(state.doc);
  renderProgress(state.doc);
  renderList();
  renderDetail();
  renderRoadmap();
  renderSources();
}
