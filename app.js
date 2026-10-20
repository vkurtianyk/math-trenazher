'use strict';

// Тексти інструкцій.
const PHRASES = {
  'porakhui-olivtsi': 'Порахуй олівці',
  'skilky-olivtsiv': 'Скільки олівців?',
  'yaku-tsyfru-skhovaly': 'Яку цифру сховали?',
  'pokazhy-trykutnyk': 'Покажи трикутник',
  'pokazhy-kvadrat': 'Покажи квадрат',
  'pokazhy-pryamokutnyk': 'Покажи прямокутник',
  'pokazhy-kolo': 'Покажи коло',
  'pokazhy-de-bilshe': 'Покажи, де більше',
  'pokazhy-de-menshe': 'Покажи, де менше',
  'porivnu': 'Порівну?',
  'dai-stilky-zh': 'Дай стільки ж',
  'porakhuimo-razom': 'Порахуймо разом',
  'torknys-kutiv': 'Торкнись кожного кута',
  'skilky-kutiv': 'Скільки кутів?',
};
for (let n = 1; n <= 10; n++) PHRASES['pokazhy-' + n] = 'Покажи ' + n;

const TASKS_PER_GAME = 5;
const NEXT_DELAY = 1000;
const LONG_PRESS = 2000;

const Games = {};
const GAME_ORDER = [];
function registerGame(def) {
  Games[def.id] = def;
  GAME_ORDER.push(def.id);
}

// ---------- Дрібні помічники ----------

const Util = {
  randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  },
  shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  },
  // Випадкове число з діапазону, не таке, як попереднє.
  freshInt(min, max, last) {
    let n;
    do { n = Util.randInt(min, max); } while (n === last && max > min);
    return n;
  },
  // `count` різних чисел з [min, max], серед них — `correct`, у випадковому порядку.
  options(correct, count, min, max) {
    if (count > max - min + 1) throw new Error('Замало чисел для варіантів');
    const rest = [];
    for (let n = min; n <= max; n++) if (n !== correct) rest.push(n);
    return Util.shuffle([correct, ...Util.shuffle(rest).slice(0, count - 1)]);
  },
  el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    if (tag === 'button') e.type = 'button';
    return e;
  },
  COLORS: ['#5b8def', '#e57373', '#66bb6a', '#ffa726', '#9575cd', '#26a69a'],
  apple() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 28 C30 14 8 26 12 52 C15 76 32 94 50 86 C68 94 85 76 88 52 C92 26 70 14 50 28 Z" fill="#e57373"/>
      <path d="M50 30 C50 20 54 12 60 8" stroke="#6d4c41" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M56 18 C66 8 80 10 82 14 C74 22 64 22 56 18 Z" fill="#81c784"/>
      <ellipse cx="34" cy="46" rx="7" ry="11" fill="#fff" opacity=".35"/>
    </svg>`;
  },
};

// ---------- Налаштування і журнал ----------

const Store = {
  read(name, empty) {
    const raw = localStorage.getItem(name);
    return raw === null ? empty : JSON.parse(raw);
  },
  write(name, value) {
    localStorage.setItem(name, JSON.stringify(value));
  },
  settings(id) {
    return { ...Games[id].defaults, ...Store.read('mt-settings', {})[id] };
  },
  saveSetting(id, field, value) {
    const all = Store.read('mt-settings', {});
    all[id] = { ...all[id], [field]: value };
    Store.write('mt-settings', all);
  },
  log() {
    return Store.read('mt-log', []);
  },
  addLog(entry) {
    Store.write('mt-log', [...Store.log(), entry]);
  },
};

// ---------- Хід вправи ----------

const $ = id => document.getElementById(id);

const state = {
  game: null, settings: null, index: 0,
  first: 0, hinted: 0, taskHinted: false,
  locked: false, token: 0,
};

const api = {
  get area() { return $('area'); },
  get choicesEl() { return $('choices'); },
  get settings() { return state.settings; },
  el: Util.el,

  instruct(key) {
    const text = PHRASES[key];
    if (text === undefined) throw new Error('Невідома фраза: ' + key);
    $('instruction').textContent = text;
  },

  // Відкласти дію; скасовується, якщо вийшли з вправи.
  later(fn, ms) {
    const token = state.token;
    setTimeout(() => { if (token === state.token) fn(); }, ms);
  },

  get locked() { return state.locked; },

  markHinted() {
    state.taskHinted = true;
  },

  success(el, onDone) {
    if (state.locked) return;
    state.locked = true;
    el.classList.add('ok');
    if (onDone) onDone();
    if (state.taskHinted) state.hinted++; else state.first++;
    api.later(() => { state.index++; nextTask(); }, NEXT_DELAY);
  },

  miss(el, correctEl) {
    if (state.locked) return;
    api.markHinted();
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    correctEl.classList.add('hint');
  },

  // Прив'язати вибір: правильна кнопка — успіх, інша — підказка.
  choose(buttons, correctBtn, onCorrect) {
    for (const b of buttons) {
      b.addEventListener('click', () => {
        if (b === correctBtn) api.success(b, onCorrect);
        else api.miss(b, correctBtn);
      });
    }
  },

  numberChoices(values, correct, onCorrect, container = api.choicesEl) {
    const buttons = values.map(v => Util.el('button', 'card', String(v)));
    container.replaceChildren(...buttons);
    api.choose(buttons, buttons[values.indexOf(correct)], onCorrect);
  },
};

function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
}

function startGame(id) {
  state.game = Games[id];
  state.settings = Store.settings(id);
  state.index = 0;
  state.first = 0;
  state.hinted = 0;
  state.token++;
  showScreen('game');
  nextTask();
}

function nextTask() {
  if (state.index === TASKS_PER_GAME) return finish();
  state.taskHinted = false;
  state.locked = false;
  $('area').replaceChildren();
  $('choices').replaceChildren();
  $('area').className = 'area area-' + state.game.id;
  $('progress').replaceChildren(...Array.from({ length: TASKS_PER_GAME }, (_, i) =>
    Util.el('span', i < state.index ? 'dot done' : i === state.index ? 'dot now' : 'dot')));
  state.game.task(api, state.index);
}

function finish() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  Store.addLog({
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    game: state.game.caption,
    first: state.first,
    hinted: state.hinted,
  });
  const star = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z" fill="#ffca28" stroke="#f9a825" stroke-width="4" stroke-linejoin="round"/></svg>';
  $('stars').replaceChildren(...Array.from({ length: TASKS_PER_GAME }, (_, i) => {
    const s = Util.el('span', 'star', star);
    s.style.animationDelay = (i * 0.35) + 's';
    return s;
  }));
  showScreen('reward');
}

function goMenu() {
  state.token++;
  showScreen('menu');
}

// ---------- Меню ----------

function buildMenu() {
  const blocks = [['sep', 'Вересень'], ['oct', 'Жовтень']];
  $('menu-blocks').replaceChildren(...blocks.map(([block, title]) => {
    const wrap = Util.el('div', 'block');
    wrap.append(Util.el('h2', 'block-title', title));
    const grid = Util.el('div', 'cards');
    for (const id of GAME_ORDER.filter(id => Games[id].block === block)) {
      const g = Games[id];
      const card = Util.el('button', 'menu-card', `${g.icon}<span class="caption">${g.caption}</span>`);
      card.setAttribute('aria-label', g.caption);
      card.addEventListener('click', () => startGame(id));
      grid.append(card);
    }
    wrap.append(grid);
    return wrap;
  }));
}

// ---------- Режим асистента ----------

function setupGear() {
  const gear = $('gear');
  let timer = null;
  const cancel = () => { clearTimeout(timer); gear.classList.remove('pressing'); };
  gear.addEventListener('pointerdown', e => {
    e.preventDefault();
    gear.classList.add('pressing');
    timer = setTimeout(() => { cancel(); openSettings(); }, LONG_PRESS);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) gear.addEventListener(ev, cancel);
  gear.addEventListener('contextmenu', e => e.preventDefault());
}

function selectFor(id, field, values, labels) {
  const sel = Util.el('select');
  const current = Store.settings(id)[field];
  values.forEach((v, i) => {
    const o = Util.el('option', '', labels[i]);
    o.value = String(v);
    o.selected = v === current;
    sel.append(o);
  });
  sel.addEventListener('change', () => Store.saveSetting(id, field, Number(sel.value)));
  return sel;
}

function openSettings() {
  const table = $('settings-table');
  table.replaceChildren();
  const head = table.insertRow();
  for (const h of ['Вправа', 'Діапазон', 'Варіантів']) head.append(Util.el('th', '', h));
  for (const id of GAME_ORDER) {
    const g = Games[id];
    const row = table.insertRow();
    row.insertCell().textContent = g.caption;
    const range = row.insertCell();
    if ('range' in g.defaults) range.append(selectFor(id, 'range', [5, 10], ['до 5', 'до 10']));
    else range.textContent = '—';
    const options = row.insertCell();
    if ('options' in g.defaults) options.append(selectFor(id, 'options', [2, 3, 4], ['2', '3', '4']));
    else options.textContent = '—';
  }
  renderLog();
  $('settings').showModal();
}

function renderLog() {
  const table = $('log-table');
  table.replaceChildren();
  const log = Store.log();
  if (log.length === 0) {
    table.insertRow().insertCell().textContent = 'Журнал порожній';
    return;
  }
  const head = table.insertRow();
  for (const h of ['Дата', 'Вправа', 'З першої спроби', 'З підказкою']) head.append(Util.el('th', '', h));
  for (const e of log.slice().reverse()) {
    const row = table.insertRow();
    for (const v of [e.date, e.game, e.first, e.hinted]) row.insertCell().textContent = v;
  }
}

function downloadCsv() {
  const rows = [['Дата', 'Вправа', 'З першої спроби', 'З підказкою'],
    ...Store.log().map(e => [e.date, e.game, e.first, e.hinted])];
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = Util.el('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'zhurnal.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Старт ----------

document.addEventListener('DOMContentLoaded', () => {
  buildMenu();
  setupGear();
  $('home').addEventListener('click', goMenu);
  $('reward-home').addEventListener('click', goMenu);
  $('settings-close').addEventListener('click', () => $('settings').close());
  $('log-csv').addEventListener('click', downloadCsv);
  $('log-clear').addEventListener('click', () => {
    if (confirm('Очистити весь журнал?')) { Store.write('mt-log', []); renderLog(); }
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
});
