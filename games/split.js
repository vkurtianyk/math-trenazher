'use strict';

(() => {
  const ANIMALS = Util.THINGS.filter(t => t.animal);
  let last = null;
  let lastThing = null;

  registerGame({
    id: 'split',
    block: 'math',
    caption: 'Розклади число',
    defaults: { range: 10 },
    icon: '<span class="icon-emoji" aria-hidden="true">🏠 🏠<br><small>🐱🐱 🐱</small></span>',

    // Будь-який розподіл правильний: завдання — побачити, що 5 = 2 + 3.
    task(api) {
      const n = Util.freshInt(2, api.settings.range, last);
      last = n;
      const thing = Util.freshThing(lastThing, ANIMALS);
      lastThing = thing;

      const pile = api.el('div', 'box');
      for (let i = 0; i < n; i++) pile.append(api.el('span', 'obj item', Util.emoji(thing.e)));
      const houses = [0, 1].map(() => {
        const h = api.el('button', 'house');
        h.append(api.el('span', 'roof'), api.el('span', 'rooms'));
        return h;
      });
      const field = api.el('div', 'field houses');
      field.append(...houses);
      const eq = Util.equation('');
      api.area.append(pile, field, eq);
      update();

      for (const h of houses) {
        h.addEventListener('click', e => {
          if (api.locked) return;
          const back = e.target.closest('.item');
          if (back) pile.append(back);
          else if (pile.firstChild) h.lastChild.append(pile.firstChild);
          update();
          if (!pile.firstChild) api.later(finish, 400);
        });
      }
      api.instruct(`Посели ${thing.acc} у будиночки`);

      function finish() {
        if (pile.firstChild) return;
        api.success(eq, () => {
          eq.textContent = `${n} = ${houses[0].lastChild.children.length} + ${houses[1].lastChild.children.length}`;
        });
      }

      function update() {
        eq.textContent = `${houses[0].lastChild.children.length} + ${houses[1].lastChild.children.length}`;
      }
    },
  });
})();
