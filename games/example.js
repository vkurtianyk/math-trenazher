'use strict';

(() => {
  let lastThing = null;

  // Число з картинкою під ним; `faded` останніх предметів — «забрані».
  const term = (n, thing, pictures, faded = 0) => {
    const t = Util.el('div', 'term');
    t.append(Util.el('span', 'term-n', String(n)));
    if (pictures) {
      const g = Util.el('span', 'group');
      for (let i = 0; i < n; i++) {
        g.append(Util.el('span', i >= n - faded ? 'item faded' : 'item', Util.emoji(thing.e)));
      }
      t.append(g);
    }
    return t;
  };

  registerGame({
    id: 'example',
    block: 'math',
    rocket: true,
    caption: 'Приклад з картинкою',
    defaults: { range: 10, options: 3, pictures: 1 },
    icon: '<span class="icon-emoji" aria-hidden="true"><b>2 + 1</b><small>🍎🍎 🍎</small></span>',

    // Завдання чергуються: додавання, віднімання, додавання…
    task(api, index) {
      const max = api.settings.range;
      const plus = index % 2 === 0;
      const a = plus ? Util.randInt(1, max - 1) : Util.randInt(2, max);
      const b = plus ? Util.randInt(1, max - a) : Util.randInt(1, a - 1);
      const answer = plus ? a + b : a - b;
      const thing = Util.freshThing(lastThing);
      lastThing = thing;
      const pictures = api.settings.pictures === 1;

      const row = api.el('div', 'example');
      const result = api.el('div', 'term');
      const resultN = api.el('span', 'term-n ask', '?');
      result.append(resultN);
      row.append(
        term(a, thing, pictures, plus ? 0 : b),
        api.el('span', 'sign', plus ? '+' : '−'),
        term(b, thing, pictures && plus),
        api.el('span', 'sign', '='),
        result,
      );
      api.area.append(row);
      if (pictures) api.hintWith(() => [[...row.querySelectorAll('.term .item:not(.faded)')]]);
      api.instruct(`Скільки буде ${a} ${plus ? 'плюс' : 'мінус'} ${b}?`);
      api.numberChoices(Util.options(answer, api.settings.options, 1, max), answer, () => {
        resultN.textContent = String(answer);
        resultN.classList.remove('ask');
      });
    },
  });
})();
