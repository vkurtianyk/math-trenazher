'use strict';

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

  // Предмети для лічби. acc — «Порахуй …», gen — «Скільки …?».
  THINGS: [
    { e: '🐱', acc: 'котиків', gen: 'котиків' },
    { e: '🐶', acc: 'песиків', gen: 'песиків' },
    { e: '🐟', acc: 'рибок', gen: 'рибок' },
    { e: '🐥', acc: 'курчат', gen: 'курчат' },
    { e: '🐞', acc: 'сонечок', gen: 'сонечок' },
    { e: '🦋', acc: 'метеликів', gen: 'метеликів' },
    { e: '🐰', acc: 'зайчиків', gen: 'зайчиків' },
    { e: '🐸', acc: 'жабок', gen: 'жабок' },
    { e: '🍐', acc: 'груші', gen: 'груш' },
    { e: '🍎', acc: 'яблука', gen: 'яблук' },
    { e: '🍓', acc: 'полуниці', gen: 'полуниць' },
    { e: '🍬', acc: 'цукерки', gen: 'цукерок' },
    { e: '🎈', acc: 'кульки', gen: 'кульок' },
    { e: '🚗', acc: 'машинки', gen: 'машинок' },
    { e: '⚽', acc: "м'ячі", gen: "м'ячів" },
    { e: '✏️', acc: 'олівці', gen: 'олівців' },
  ],

  // Новий предмет, не такий, як попередній.
  freshThing(last) {
    let t;
    do { t = Util.pick(Util.THINGS); } while (t === last);
    return t;
  },

  emoji(e) {
    return `<span class="emoji" aria-hidden="true">${e}</span>`;
  },
};

// ---------- Голос ----------

// Озвучка через голос планшета (Web Speech API). Говорить лише українським голосом;
// якщо його немає — мовчить, інструкцію видно текстом.
const Voice = {
  voice: null,

  init() {
    if (!('speechSynthesis' in window)) return;
    const find = () => {
      Voice.voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('uk')) || null;
    };
    find();
    speechSynthesis.addEventListener('voiceschanged', find);
  },

  get on() {
    return Store.read('mt-voice', true) && Voice.voice !== null;
  },

  // queue=true — дочекатися кінця попередньої фрази, інакше перебити її.
  say(text, queue = false) {
    if (!Voice.on) return;
    if (!queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'uk-UA';
    u.voice = Voice.voice;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  },

  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
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

  instruct(text) {
    $('instruction').textContent = text;
    Voice.say(text, true);
  },

  say: Voice.say,

  repeat() {
    Voice.say($('instruction').textContent);
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
    Voice.say('Молодець!');
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
    api.repeat();
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

  // Підказка «Порахуймо разом»: предмети кожної групи по черзі отримують номер 1, 2, 3…
  // Після цього повертається інструкція `back` і викликається `done`.
  countTogether(groups, back, done) {
    api.markHinted();
    api.instruct('Порахуймо разом');
    const STEP = 900;
    let t = STEP * 1.5;
    for (const group of groups) {
      group.forEach((item, i) => {
        api.later(() => {
          item.classList.add('hint');
          item.dataset.n = i + 1;
          Voice.say(String(i + 1));
        }, t);
        t += STEP;
      });
      t += STEP;
    }
    api.later(() => {
      for (const item of groups.flat()) {
        item.classList.remove('hint');
        delete item.dataset.n;
      }
      api.instruct(back);
      done();
    }, t);
  },
};

// ---------- Альбом наліпок ----------

const STICKERS = ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
  '🐔', '🐧', '🦉', '🐢', '🐟', '🐬', '🐳', '🦋', '🐞', '🐝', '🦄', '🐘',
  '🦒', '🦓', '🐴', '🐑', '🐿️', '🦔'];

// Нова наліпка за завершену вправу. Коли альбом повний — будь-яка з уже зібраних.
function awardSticker() {
  const have = Store.read('mt-stickers', []);
  const missing = STICKERS.filter(s => !have.includes(s));
  if (missing.length === 0) return Util.pick(STICKERS);
  const s = Util.pick(missing);
  Store.write('mt-stickers', [...have, s]);
  return s;
}

function openAlbum() {
  const have = Store.read('mt-stickers', []);
  $('album-grid').replaceChildren(...STICKERS.map(s => have.includes(s)
    ? Util.el('span', 'slot got', Util.emoji(s))
    : Util.el('span', 'slot')));
  showScreen('album');
}

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
  $('repeat').hidden = !Voice.on;
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
  $('sticker').innerHTML = Util.emoji(awardSticker());
  showScreen('reward');
  Voice.say('Молодець!', true);
}

function goMenu() {
  state.token++;
  Voice.stop();
  showScreen('menu');
}

// ---------- Меню ----------

function buildMenu() {
  const blocks = [['sep', 'Вересень'], ['oct', 'Жовтень'], ['extra', 'Ще вправи']];
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
  const voice = $('voice-toggle');
  voice.value = String(Store.read('mt-voice', true));
  $('voice-status').textContent = Voice.voice
    ? 'Голос: ' + Voice.voice.name
    : 'На цьому планшеті немає українського голосу — інструкції лише текстом.';
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
  Voice.init();
  buildMenu();
  setupGear();
  $('repeat').addEventListener('click', api.repeat);
  $('voice-toggle').addEventListener('change', e => Store.write('mt-voice', e.target.value === 'true'));
  $('home').addEventListener('click', goMenu);
  $('reward-home').addEventListener('click', goMenu);
  $('album-open').addEventListener('click', openAlbum);
  $('album-home').addEventListener('click', goMenu);
  $('album-clear').addEventListener('click', () => {
    if (confirm('Почати альбом наліпок заново?')) Store.write('mt-stickers', []);
  });
  $('settings-close').addEventListener('click', () => $('settings').close());
  $('log-csv').addEventListener('click', downloadCsv);
  $('log-clear').addEventListener('click', () => {
    if (confirm('Очистити весь журнал?')) { Store.write('mt-log', []); renderLog(); }
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
});
