'use strict';

(() => {
  const SHAPES = {
    'трикутник': c => `<path d="M50 8 L94 88 L6 88 Z" fill="${c}"/>`,
    'квадрат': c => `<rect x="12" y="12" width="76" height="76" fill="${c}"/>`,
    'прямокутник': c => `<rect x="4" y="28" width="92" height="44" fill="${c}"/>`,
    'коло': c => `<circle cx="50" cy="50" r="42" fill="${c}"/>`,
  };
  const svg = (type, color) => `<svg viewBox="0 0 100 100" aria-hidden="true">${SHAPES[type](color)}</svg>`;

  let order = [];

  registerGame({
    id: 'shapes',
    block: 'sep',
    caption: 'Покажи фігуру',
    defaults: { options: 3 },
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <path d="M30 14 L54 56 L6 56 Z" fill="#5b8def"/>
      <rect x="66" y="12" width="44" height="44" fill="#66bb6a"/>
      <circle cx="34" cy="88" r="22" fill="#ffa726"/>
      <rect x="64" y="74" width="50" height="28" fill="#9575cd"/>
    </svg>`,

    task(api, index) {
      if (index === 0) order = Util.shuffle(Object.keys(SHAPES));
      const target = order[index % order.length];
      const others = Util.shuffle(Object.keys(SHAPES).filter(t => t !== target));
      const types = Util.shuffle([target, ...others.slice(0, api.settings.options - 1)]);
      const colors = Util.shuffle(Util.COLORS);
      const buttons = types.map((type, i) => {
        const b = api.el('button', 'obj shape', svg(type, colors[i]));
        b.setAttribute('aria-label', 'Фігура');
        const rot = type === 'коло' ? 0 : Util.randInt(-25, 25);
        b.style.setProperty('--shape-transform', `rotate(${rot}deg) scale(${(Util.randInt(60, 100) / 100).toFixed(2)})`);
        return b;
      });
      const field = api.el('div', 'field');
      field.append(...buttons);
      api.area.append(field);
      api.instruct('Покажи ' + target);
      api.choose(buttons, buttons[types.indexOf(target)]);
    },
  });
})();
