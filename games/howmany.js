'use strict';

(() => {
  let last = null;
  let lastThing = null;

  registerGame({
    id: 'howmany',
    block: 'extra',
    caption: 'Скільки тут?',
    defaults: { range: 5, options: 3 },
    icon: '<span class="icon-emoji" aria-hidden="true">🐞🐞<br><b>2</b></span>',

    task(api) {
      const max = api.settings.range;
      const n = Util.freshInt(1, max, last);
      last = n;
      const thing = Util.freshThing(lastThing);
      lastThing = thing;
      // Акуратні ряди по 5 — так кількість легше «побачити».
      const group = api.el('div', 'group big');
      for (let i = 0; i < n; i++) group.append(api.el('span', 'item', Util.emoji(thing.e)));
      api.area.append(group);
      api.instruct(`Скільки ${thing.gen}?`);
      api.numberChoices(Util.options(n, api.settings.options, 1, max), n);
    },
  });
})();
