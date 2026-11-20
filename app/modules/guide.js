/* guide.js — pure presentation. Every view is rebuilt from view.data + view.marked; no handler lives
   in this file, so a re-render never loses state. */

import { view, holds, tallyByGrade, earnedCount } from './store.js';

const FAMILY = {
  story: 'Story',
  collectible: 'Collectible',
  activity: 'Activity',
  stranger: 'Stranger',
  robbery: 'Robbery',
  freeplay: 'Free roam',
};
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const el = (id) => document.getElementById(id);

export const familyName = (kind) => FAMILY[kind] ?? kind;
export const pageOf = (data) => new Map(data.sources.map((s) => [s.id, s]));
export const pagesOf = (trophy) => [...new Set(trophy.steps.flatMap((s) => s.srcs))];
export const masked = (trophy) => view.mask && trophy.kind === 'story' && !holds(trophy);

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

function anchor(source) {
  const a = node('a', 'src', source.name.split(' — ')[0]);
  a.href = source.url;
  a.target = '_blank';
  a.rel = 'noreferrer noopener';
  a.referrerPolicy = 'no-referrer';
  a.title = `${source.name} · ${source.url}`;
  return a;
}

function sourceStrip(ids, lookup) {
  const box = node('span', 'srcs');
  for (const id of ids) {
    const page = lookup.get(id);
    if (page) box.append(anchor(page));
  }
  return box;
}

/* ---------- header ---------- */

export function paintCounters(data) {
  const steps = data.trophies.reduce((n, t) => n + t.steps.length, 0);
  const links = data.trophies.reduce((n, t) => n + t.steps.reduce((m, s) => m + s.srcs.length, 0), 0);
  el('c-trophies').textContent = String(data.trophies.length);
  el('c-steps').textContent = String(steps);
  el('c-steps').title = `${links} source links spread over ${steps} steps`;
  el('c-sources').textContent = String(data.sources.length);
  el('c-earned').textContent = String(earnedCount(data));
}

/* ---------- meter and tallies ---------- */

export function paintMeter(data) {
  const total = data.trophies.length;
  const done = earnedCount(data);
  const pct = total ? Math.round((done / total) * 100) : 0;
  el('earned-count').textContent = String(done);
  el('total-count').textContent = String(total);
  el('earned-pct').textContent = `${pct}%`;
  el('meter-fill').style.width = `${pct}%`;
  const bar = el('meter-bar');
  bar.setAttribute('aria-valuenow', String(done));
  bar.setAttribute('aria-valuemax', String(total));

  const rows = tallyByGrade(data);
  const list = el('tally');
  list.replaceChildren();
  for (const grade of GRADES) {
    const [got, all] = rows[grade] ?? [0, 0];
    const li = node('li');
    li.append(node('b', null, String(got)), document.createTextNode(`/${all} ${grade}`));
    list.append(li);
  }
  const lost = data.trophies.filter((t) => t.missable);
  const li = node('li', 'alarm');
  li.append(node('b', null, String(lost.length)), document.createTextNode(' missable'));
  li.title = lost.map((t) => t.name).join(', ');
  list.append(li);
  el('c-earned').textContent = String(done);
}

/* ---------- checklist rows ---------- */

function passesFilters(trophy) {
  const q = view.query;
  if (q.grade !== 'any' && trophy.grade !== q.grade) return false;
  if (q.family !== 'any' && trophy.kind !== q.family) return false;
  if (q.state === 'earned' && !holds(trophy)) return false;
  if (q.state === 'missing' && holds(trophy)) return false;
  const needle = q.text.trim().toLowerCase();
  if (!needle) return true;
  return [trophy.name, trophy.description, trophy.guide, familyName(trophy.kind), trophy.stage]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

export function paintRows() {
  const data = view.data;
  const list = el('rows');
  const shown = data.trophies.filter(passesFilters);
  list.replaceChildren();
  el('list-note').textContent = `${shown.length} of ${data.trophies.length} shown${view.mask ? ' · story names stay covered until earned' : ''}`;

  if (!shown.length) {
    list.append(node('li', 'empty', 'Nothing fits those filters. Widen one and the list fills again.'));
    return;
  }

  const bag = document.createDocumentFragment();
  for (const t of shown) {
    const li = node('li');
    const row = node('div', 'row');
    if (holds(t)) row.classList.add('done');
    if (view.open === t.name) row.classList.add('picked');
    row.dataset.name = t.name;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');

    const box = node('input');
    box.type = 'checkbox';
    box.checked = holds(t);
    box.dataset.role = 'toggle';
    box.setAttribute('aria-label', `Mark ${masked(t) ? 'this story trophy' : t.name} as earned`);
    row.append(box);

    row.append(node('span', `badge ${t.grade}`, t.grade[0].toUpperCase()));

    const stack = node('span');
    stack.append(node('span', 't-name', masked(t) ? 'Hidden story trophy' : t.name));
    stack.append(
      node(
        'span',
        't-sub',
        masked(t) ? 'Turn the spoiler mask off to read it' : `${familyName(t.kind)} · ${t.steps.length} cited steps`,
      ),
    );
    row.append(stack);

    row.append(node('span', 'mark', t.missable ? '⚑' : ''));
    li.append(row);
    bag.append(li);
  }
  list.append(bag);
}

/* ---------- detail panel ---------- */

export function paintDetail() {
  const data = view.data;
  const panel = el('detail');
  const lookup = pageOf(data);
  const t = data.trophies.find((x) => x.name === view.open);
  panel.replaceChildren();
  if (!t) {
    const box = node('div', 'placeholder');
    box.append(node('h2', null, 'Choose a trophy'));
    box.append(node('p', null, 'The guide, the missable warning and the sources for each step show up in this column.'));
    panel.append(box);
    return;
  }

  const head = node('div', 'd-head');
  head.append(node('span', `badge ${t.grade}`, t.grade));
  head.append(node('span', 'badge tag', familyName(t.kind)));
  if (t.missable) head.append(node('span', 'badge missable', 'missable'));
  if (t.hidden) head.append(node('span', 'badge hush', 'hidden on PSN'));
  head.append(node('h2', null, masked(t) ? 'Hidden story trophy' : t.name));
  panel.append(head);

  panel.append(node('p', 'd-desc', masked(t) ? 'The spoiler mask is covering this description.' : t.description));

  const stage = data.stages.find((s) => s.id === t.stage);
  const facts = node('ul', 'd-facts');
  for (const [label, value] of [
    ['Stage', stage ? stage.title : t.stage],
    ['Steps', String(t.steps.length)],
    ['Pages', String(pagesOf(t).length)],
  ]) {
    const li = node('li');
    li.append(node('b', null, `${label}: `), document.createTextNode(value));
    facts.append(li);
  }
  panel.append(facts);

  if (!masked(t)) {
    panel.append(node('p', 'd-guide', t.guide));
    if (t.missable) {
      const warn = node('p', 'alarm-box');
      warn.append(node('strong', null, 'Missable. '));
      warn.append(
        document.createTextNode('One of these steps can be lost for good once the chapter moves on. Read it before you leave the area.'),
      );
      panel.append(warn);
    }
    panel.append(node('p', 'd-sub', 'How to earn it'));
    const ol = node('ol', 'steps');
    t.steps.forEach((step) => {
      const li = node('li');
      li.append(node('p', 'step-text', step.text));
      li.append(sourceStrip(step.srcs, lookup));
      ol.append(li);
    });
    panel.append(ol);
  }

  const actions = node('div', 'd-actions');
  const button = node('button', holds(t) ? 'earn-btn on' : 'earn-btn', holds(t) ? 'Earned — undo' : 'Mark earned');
  button.type = 'button';
  button.dataset.role = 'detail-flip';
  actions.append(button);
  panel.append(actions);
}

/* ---------- route ---------- */

export function paintRoute() {
  const data = view.data;
  const list = el('route');
  const lost = data.trophies.filter((t) => t.missable);
  el('route-summary').textContent =
    `${data.trophies.length} trophies across ${data.stages.length} stages · ${earnedCount(data)} earned · ` +
    `${lost.length} missable (${lost.map((t) => t.name).join(', ')}). Chips jump back to the checklist with the trophy open.`;
  list.replaceChildren();
  const lookup = pageOf(data);

  for (const stage of data.stages) {
    const items = data.trophies.filter((t) => t.stage === stage.id);
    const done = items.filter(holds).length;
    const li = node('li', 'stage');
    if (items.some((t) => t.missable)) li.classList.add('has-missable');

    const top = node('div', 's-top');
    top.append(node('h3', null, stage.title));
    top.append(node('span', 's-when', stage.when));
    top.append(node('span', 's-tally', `${done}/${items.length} earned · ${stage.counts}`));
    li.append(top);
    li.append(node('p', 's-body', stage.body));

    const strip = node('p', 's-srcs');
    for (const id of stage.srcs) {
      const page = lookup.get(id);
      if (page) strip.append(anchor(page));
    }
    if (strip.childElementCount) li.append(strip);

    const chips = node('ul', 'chips');
    for (const t of items) {
      const chip = node('button', 'chip', t.name);
      chip.type = 'button';
      chip.dataset.jump = t.name;
      if (holds(t)) chip.classList.add('done');
      if (t.missable) {
        chip.classList.add('missable');
        chip.title = `${t.name} — missable, read the steps before the chapter ends`;
      }
      chips.append(chip);
    }
    if (!items.length) chips.append(node('span', 'chip', 'nothing pinned to this stage'));
    li.append(chips);
    list.append(li);
  }
}

/* ---------- citations ---------- */

export function paintCitations() {
  const data = view.data;
  const lookup = pageOf(data);
  const usage = new Map(data.sources.map((s) => [s.id, { steps: 0, trophies: new Set() }]));
  let links = 0;
  let twoPlus = 0;
  for (const t of data.trophies) {
    if (pagesOf(t).length > 1) twoPlus += 1;
    for (const step of t.steps) {
      for (const id of step.srcs) {
        const slot = usage.get(id);
        if (!slot) continue;
        slot.steps += 1;
        slot.trophies.add(t.name);
        links += 1;
      }
    }
  }
  const steps = data.trophies.reduce((n, t) => n + t.steps.length, 0);
  el('cite-summary').textContent =
    `${data.trophies.length} trophies · ${steps} steps · ${links} citations · ${data.sources.length} pages · ` +
    `${twoPlus} trophies rest on more than one page. Names, descriptions and grades come from the PlayStation list; every route note names where it was checked.`;

  const cards = el('cite-cards');
  cards.replaceChildren();
  for (const page of data.sources) {
    const card = node('div', 'cite');
    card.append(node('h3', null, page.name));
    const link = anchor(page);
    link.textContent = page.url;
    card.append(link);
    card.append(node('p', null, page.note));
    const used = usage.get(page.id);
    card.append(node('span', 'used', `${used.steps} citations · ${used.trophies.size} trophies`));
    cards.append(card);
  }

  const body = el('matrix').querySelector('tbody');
  body.replaceChildren();
  for (const t of data.trophies) {
    const tr = node('tr');
    tr.append(node('td', null, masked(t) ? 'Hidden story trophy' : t.name));
    tr.append(node('td', 'num', String(t.steps.length)));
    const pages = node('td', 'pages');
    for (const id of pagesOf(t)) {
      const page = lookup.get(id);
      if (page) pages.append(anchor(page));
    }
    tr.append(pages);
    body.append(tr);
  }
}

export function repaint() {
  paintCounters(view.data);
  paintMeter(view.data);
  paintRows();
  paintDetail();
  paintRoute();
  paintCitations();
}
