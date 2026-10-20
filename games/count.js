'use strict';

(() => {
  const pencil = color => `<svg viewBox="0 0 60 160" aria-hidden="true">
    <rect x="6" y="8" width="48" height="104" rx="4" fill="${color}"/>
    <rect x="6" y="8" width="48" height="16" rx="4" fill="#f48fb1"/>
    <rect x="6" y="22" width="48" height="8" fill="#bdbdbd"/>
    <path d="M6 112 L54 112 L30 154 Z" fill="#ffe0b2"/>
    <path d="M22 140 L38 140 L30 154 Z" fill="#424242"/>
  </svg>`;

  let last = null;

  registerGame({
    id: 'count',
    block: 'sep',
    caption: 'Порахуй',
    defaults: { range: 10, options: 3 },
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <g transform="translate(8 20) rotate(-8)">${pencil('#5b8def').replace('<svg', '<svg width="30" height="80"')}</g>
      <g transform="translate(45 20)">${pencil('#66bb6a').replace('<svg', '<svg width="30" height="80"')}</g>
      <g transform="translate(82 18) rotate(8)">${pencil('#ffa726').replace('<svg', '<svg width="30" height="80"')}</g>
    </svg>`,

    task(api) {
      const max = api.settings.range;
      const n = Util.freshInt(3, max, last);
      last = n;
      const field = api.el('div', 'field');
      let counted = 0;
      for (let i = 0; i < n; i++) {
        const b = api.el('button', 'obj pencil', pencil(Util.pick(Util.COLORS)));
        b.style.setProperty('--rot', Util.randInt(-12, 12) + 'deg');
        b.setAttribute('aria-label', 'Олівець');
        b.addEventListener('click', () => {
          if (b.classList.contains('counted')) return;
          counted++;
          b.classList.add('counted');
          b.dataset.n = counted;
          if (counted === n) api.later(ask, 900);
        });
        field.append(b);
      }
      api.area.append(field);
      api.instruct('porakhui-olivtsi');

      function ask() {
        api.instruct('skilky-olivtsiv');
        api.numberChoices(Util.options(n, api.settings.options, 1, max), n);
      }
    },
  });
})();
