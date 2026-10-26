'use strict';

(() => {
  const cloud = `<svg viewBox="0 0 100 70" aria-hidden="true">
    <path d="M24 60 C8 60 4 40 18 34 C16 18 36 10 46 20 C52 6 76 8 78 26 C94 26 98 52 82 60 Z" fill="#90caf9" stroke="#5c8fc7" stroke-width="3"/>
  </svg>`;

  let last = null;

  registerGame({
    id: 'hidden',
    block: 'sep',
    caption: 'Яку цифру сховали?',
    ranges: [5, 10, 15],
    defaults: { range: 10, options: 3 },
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <rect x="6" y="40" width="108" height="40" rx="8" fill="#fff" stroke="#90a4ae" stroke-width="3"/>
      <text x="22" y="70" font-size="26" font-weight="700" text-anchor="middle" fill="#37474f">1</text>
      <text x="47" y="70" font-size="26" font-weight="700" text-anchor="middle" fill="#37474f">2</text>
      <g transform="translate(58 44) scale(.3)">${cloud.replace(/<\/?svg[^>]*>/g, '')}</g>
      <text x="100" y="70" font-size="26" font-weight="700" text-anchor="middle" fill="#37474f">4</text>
    </svg>`,

    task(api) {
      const max = api.settings.range;
      const hidden = Util.freshInt(1, max, last);
      last = hidden;
      const strip = api.el('div', 'strip');
      let hiddenCell;
      for (let n = 1; n <= max; n++) {
        const cell = api.el('div', 'cell', n === hidden ? cloud : String(n));
        if (n === hidden) { cell.classList.add('cloud'); hiddenCell = cell; }
        strip.append(cell);
      }
      api.area.append(strip);
      api.hintWith(() => [[...strip.children].slice(0, hidden - 1)]);
      api.instruct('Яку цифру сховали?');
      api.numberChoices(Util.options(hidden, api.settings.options, 1, max), hidden, () => {
        hiddenCell.textContent = String(hidden);
        hiddenCell.classList.replace('cloud', 'revealed');
      });
    },
  });
})();
