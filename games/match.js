'use strict';

(() => {
  let last = null;
  let lastThing = null;

  registerGame({
    id: 'match',
    block: 'extra',
    caption: 'Знайди стільки ж',
    defaults: { range: 5, options: 2 },
    icon: '<span class="icon-emoji" aria-hidden="true"><b>3</b><br>🐟🐟🐟</span>',

    task(api) {
      const max = api.settings.range;
      const n = Util.freshInt(1, max, last);
      last = n;
      const thing = Util.freshThing(lastThing);
      lastThing = thing;
      const counts = Util.options(n, api.settings.options, 1, max);
      const buttons = counts.map(c => {
        const b = api.el('button', 'group-card');
        const group = api.el('span', 'group');
        for (let i = 0; i < c; i++) group.append(api.el('span', 'item', Util.emoji(thing.e)));
        b.append(group);
        return b;
      });
      const field = api.el('div', 'field');
      field.append(api.el('div', 'card target', String(n)));
      api.area.append(field);
      api.choicesEl.append(...buttons);
      api.instruct(`Покажи, де ${n}`);
      api.choose(buttons, buttons[counts.indexOf(n)]);
    },
  });
})();
