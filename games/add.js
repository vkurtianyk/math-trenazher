'use strict';

(() => {
  let lastThing = null;

  registerGame({
    id: 'add',
    block: 'math',
    rocket: true,
    caption: 'Разом',
    defaults: { range: 10, options: 3 },
    icon: '<span class="icon-emoji" aria-hidden="true">🐱🐱 🐱<br><small>2 + 1</small></span>',

    task(api) {
      const max = api.settings.range;
      const a = Util.randInt(1, max - 1);
      const b = Util.randInt(1, max - a);
      const sum = a + b;
      const thing = Util.freshThing(lastThing);
      lastThing = thing;

      const plates = api.el('div', 'field plates');
      const basket = api.el('div', 'box basket');
      let moved = 0;
      for (const count of [a, b]) {
        const plate = api.el('div', 'plate give-plate');
        for (let i = 0; i < count; i++) {
          const item = api.el('button', 'obj item', Util.emoji(thing.e));
          item.addEventListener('click', () => {
            if (item.parentElement === basket) return;
            basket.append(item);
            moved++;
            item.dataset.n = moved;
            api.say(String(moved));
            if (moved === sum) api.later(ask, 900);
          });
          plate.append(item);
        }
        plates.append(plate);
      }
      const eq = Util.equation(`${a} + ${b} = ?`);
      api.area.append(plates, basket, eq);
      api.instruct('Поклади все в кошик');

      function ask() {
        api.instruct(`Скільки разом ${thing.gen}?`);
        api.hintWith(() => [[...basket.children]]);
        api.numberChoices(Util.options(sum, api.settings.options, 1, max), sum, () => {
          eq.textContent = `${a} + ${b} = ${sum}`;
        });
      }
    },
  });
})();
