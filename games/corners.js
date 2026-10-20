'use strict';

(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const poly = pts => pts.map(p => p.join(',')).join(' ');

  // Кути в координатах 400×400; `extra` — деталі малюнка.
  const FIGURES = {
    triangle: { pts: [[200, 50], [360, 340], [40, 340]], color: '#5b8def' },
    triangle2: { pts: [[60, 80], [350, 150], [150, 350]], color: '#ffa726' },
    square: { pts: [[80, 80], [320, 80], [320, 320], [80, 320]], color: '#66bb6a' },
    rectangle: { pts: [[30, 110], [370, 110], [370, 290], [30, 290]], color: '#9575cd' },
    book: {
      pts: [[90, 40], [310, 40], [310, 360], [90, 360]], color: '#e57373',
      extra: `<rect x="90" y="40" width="34" height="320" fill="#c62828" opacity=".35"/>
        <rect x="160" y="110" width="110" height="18" rx="6" fill="#fff" opacity=".8"/>
        <rect x="160" y="146" width="80" height="14" rx="6" fill="#fff" opacity=".8"/>`,
    },
    notebook: {
      pts: [[70, 60], [330, 60], [330, 340], [70, 340]], color: '#4fc3f7',
      extra: `<rect x="110" y="120" width="180" height="70" rx="8" fill="#fff"/>
        <line x1="130" y1="145" x2="270" y2="145" stroke="#90a4ae" stroke-width="5"/>
        <line x1="130" y1="168" x2="240" y2="168" stroke="#90a4ae" stroke-width="5"/>`,
    },
  };
  const STAR = 'M0 -34 L10 -11 L33 -10 L15 6 L21 30 L0 17 L-21 30 L-15 6 L-33 -10 L-10 -11 Z';

  let order = [];

  registerGame({
    id: 'corners',
    block: 'oct',
    caption: 'Скільки кутів?',
    defaults: {},
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <path d="M60 18 L104 98 L16 98 Z" fill="#5b8def"/>
      <g fill="#ffca28" stroke="#f9a825" stroke-width="2">
        <path transform="translate(60 18) scale(.35)" d="${STAR}"/>
        <path transform="translate(104 98) scale(.35)" d="${STAR}"/>
        <path transform="translate(16 98) scale(.35)" d="${STAR}"/>
      </g>
    </svg>`,

    task(api, index) {
      if (index === 0) {
        order = Util.shuffle(['triangle', 'triangle2', 'square', 'rectangle', Util.pick(['book', 'notebook'])]);
      }
      const fig = FIGURES[order[index]];
      const total = fig.pts.length;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 400 400');
      svg.setAttribute('class', 'figure');
      svg.innerHTML = `<polygon points="${poly(fig.pts)}" fill="${fig.color}" stroke="#37474f" stroke-width="6" stroke-linejoin="round"/>${fig.extra || ''}`;

      let counted = 0;
      for (const [x, y] of fig.pts) {
        const hit = document.createElementNS(NS, 'circle');
        hit.setAttribute('cx', x);
        hit.setAttribute('cy', y);
        hit.setAttribute('r', 48);
        hit.setAttribute('class', 'corner');
        hit.addEventListener('click', () => {
          if (hit.classList.contains('counted')) return;
          hit.classList.add('counted');
          counted++;
          const star = document.createElementNS(NS, 'path');
          star.setAttribute('d', STAR);
          star.setAttribute('transform', `translate(${x} ${y})`);
          star.setAttribute('class', 'sticker');
          const num = document.createElementNS(NS, 'text');
          num.setAttribute('x', x);
          num.setAttribute('y', y + 12);
          num.setAttribute('class', 'sticker-n');
          num.textContent = counted;
          svg.append(star, num);
          if (counted === total) api.later(ask, 900);
        });
        svg.append(hit);
      }
      api.area.append(svg);
      api.instruct('torknys-kutiv');

      function ask() {
        api.instruct('skilky-kutiv');
        api.numberChoices(Util.shuffle([3, 4]), total);
      }
    },
  });
})();
