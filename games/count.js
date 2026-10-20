'use strict';

(() => {
  let last = null;
  let lastThing = null;

  registerGame({
    id: 'count',
    block: 'sep',
    caption: 'Порахуй',
    defaults: { range: 10, options: 3 },
    icon: '<span class="icon-emoji" aria-hidden="true">🐱🐱<br>🐱</span>',

    task(api) {
      const max = api.settings.range;
      const n = Util.freshInt(3, max, last);
      last = n;
      const thing = Util.freshThing(lastThing);
      lastThing = thing;
      const field = api.el('div', 'field');
      let counted = 0;
      for (let i = 0; i < n; i++) {
        const b = api.el('button', 'obj thing', Util.emoji(thing.e));
        b.style.setProperty('--rot', Util.randInt(-12, 12) + 'deg');
        b.addEventListener('click', () => {
          if (b.classList.contains('counted')) return;
          counted++;
          b.classList.add('counted');
          b.dataset.n = counted;
          api.say(String(counted));
          if (counted === n) api.later(ask, 900);
        });
        field.append(b);
      }
      api.area.append(field);
      api.instruct('Порахуй ' + thing.acc);

      function ask() {
        api.instruct(`Скільки ${thing.gen}?`);
        api.numberChoices(Util.options(n, api.settings.options, 1, max), n);
      }
    },
  });
})();
