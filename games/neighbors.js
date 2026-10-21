'use strict';

(() => {
  let last = null;

  registerGame({
    id: 'neighbors',
    block: 'teen',
    caption: 'Сусіди числа',
    defaults: { range: 15, options: 3 },
    ranges: [10, 15],
    icon: '<span class="icon-emoji" aria-hidden="true"><b>7 → ?</b></span>',

    // Спершу три завдання «після», потім два «перед».
    task(api, index) {
      const max = api.settings.range;
      const after = index < 3;
      const n = after ? Util.freshInt(1, max - 1, last) : Util.freshInt(2, max, last);
      last = n;
      const answer = after ? n + 1 : n - 1;
      const strip = api.el('div', 'strip');
      let askCell;
      for (let i = 1; i <= max; i++) {
        const cell = api.el('div', 'cell', i === answer ? '?' : String(i));
        if (i === n) cell.classList.add('focus');
        if (i === answer) { cell.classList.add('ask'); askCell = cell; }
        strip.append(cell);
      }
      api.area.append(strip);
      api.instruct(after ? `Яке число після ${n}?` : `Яке число перед ${n}?`);
      api.numberChoices(Util.options(answer, api.settings.options, 1, max), answer, () => {
        askCell.textContent = String(answer);
        askCell.classList.replace('ask', 'revealed');
      });
    },
  });
})();
