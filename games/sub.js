'use strict';

(() => {
  let lastThing = null;

  registerGame({
    id: 'sub',
    block: 'math',
    caption: 'Скільки залишилось?',
    defaults: { range: 10, options: 3 },
    icon: '<span class="icon-emoji" aria-hidden="true">🐥🐥<span class="faded">🐥</span><br><small>3 − 1</small></span>',

    task(api) {
      const max = api.settings.range;
      const a = Util.randInt(2, max);
      const b = Util.randInt(1, a - 1);
      const rest = a - b;
      const thing = Util.freshThing(lastThing);
      lastThing = thing;

      const field = api.el('div', 'field');
      let taken = 0;
      for (let i = 0; i < a; i++) {
        const item = api.el('button', 'obj thing', Util.emoji(thing.e));
        item.addEventListener('click', () => {
          if (taken === b || item.classList.contains('gone')) return;
          taken++;
          item.classList.add('gone');
          api.say(String(taken));
          if (taken === b) api.later(ask, 900);
        });
        field.append(item);
      }
      const eq = Util.equation(`${a} − ${b} = ?`);
      api.area.append(field, eq);
      api.instruct(`Забери ${b}`);

      function ask() {
        api.instruct(`Скільки ${thing.gen} залишилось?`);
        api.numberChoices(Util.options(rest, api.settings.options, 1, max), rest, () => {
          eq.textContent = `${a} − ${b} = ${rest}`;
        });
      }
    },
  });
})();
