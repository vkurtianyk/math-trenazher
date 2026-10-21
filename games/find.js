'use strict';

(() => {
  let last = null;

  registerGame({
    id: 'find',
    block: 'oct',
    caption: 'Знайди цифру',
    ranges: [5, 10, 15],
    defaults: { range: 5, options: 3 },
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <rect x="4" y="34" width="34" height="50" rx="6" fill="#fff" stroke="#90a4ae" stroke-width="3"/>
      <rect x="43" y="28" width="34" height="62" rx="6" fill="#fff" stroke="#66bb6a" stroke-width="5"/>
      <rect x="82" y="34" width="34" height="50" rx="6" fill="#fff" stroke="#90a4ae" stroke-width="3"/>
      <text x="21" y="68" font-size="26" font-weight="700" text-anchor="middle" fill="#37474f">1</text>
      <text x="60" y="70" font-size="32" font-weight="700" text-anchor="middle" fill="#37474f">3</text>
      <text x="99" y="68" font-size="26" font-weight="700" text-anchor="middle" fill="#37474f">5</text>
    </svg>`,

    task(api) {
      const max = api.settings.range;
      const target = Util.freshInt(1, max, last);
      last = target;
      const field = api.el('div', 'field');
      api.area.append(field);
      api.instruct('Покажи ' + target);
      api.numberChoices(Util.options(target, api.settings.options, 1, max), target, null, field);
    },
  });
})();
