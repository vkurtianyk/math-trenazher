'use strict';

(() => {
  // Рамка на 10 місць (2 ряди по 5), заповнено `count`.
  const frame = (count, thing) => {
    const f = Util.el('div', 'frame');
    for (let i = 0; i < 10; i++) f.append(Util.el('span', 'frame-cell', i < count ? Util.emoji(thing.e) : ''));
    return f;
  };

  let last = null;
  let lastThing = null;

  registerGame({
    id: 'teen',
    block: 'teen',
    caption: 'Десяток і ще',
    defaults: { options: 3 },
    icon: '<span class="icon-emoji" aria-hidden="true"><b>13</b><small>🔟 ➕ 3</small></span>',

    task(api) {
      const k = Util.freshInt(1, 5, last);
      last = k;
      const thing = Util.freshThing(lastThing);
      lastThing = thing;
      const total = 10 + k;
      const field = api.el('div', 'field frames');
      field.append(frame(10, thing), frame(k, thing));
      const eq = Util.equation(`10 і ще ${k}`);
      api.area.append(field, eq);
      api.hintWith(() => [[...field.querySelectorAll('.frame-cell')].filter(c => c.firstChild)]);
      api.instruct(`Скільки всього ${thing.gen}?`);
      api.numberChoices(Util.options(total, api.settings.options, 11, 15), total, () => {
        eq.textContent = `10 і ще ${k} — це ${total}`;
      });
    },
  });
})();
