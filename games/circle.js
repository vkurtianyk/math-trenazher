'use strict';

(() => {
  const NS = 'http://www.w3.org/2000/svg';

  // Коло — лише лінія, круг — зафарбований. Відволікачі — так само лінією або зафарбовані.
  const FIGURES = {
    'коло': c => `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="8"/>`,
    'круг': c => `<circle cx="50" cy="50" r="42" fill="${c}"/>`,
    'квадрат-лінія': c => `<rect x="14" y="14" width="72" height="72" fill="none" stroke="${c}" stroke-width="8"/>`,
    'квадрат': c => `<rect x="12" y="12" width="76" height="76" fill="${c}"/>`,
    'трикутник-лінія': c => `<path d="M50 12 L90 86 L10 86 Z" fill="none" stroke="${c}" stroke-width="8" stroke-linejoin="round"/>`,
    'трикутник': c => `<path d="M50 8 L94 88 L6 88 Z" fill="${c}"/>`,
  };
  const ROUND = ['⚽', '🍊', '🕒', '🍪', '🍩', '🏀', '🎯', '🌕'];
  const NOT_ROUND = ['📘', '📦', '🏠', '✏️', '📺', '🧀', '📐', '✉️', '🍌'];
  const DOTS = 8;

  registerGame({
    id: 'circle',
    block: 'geom',
    caption: 'Коло і круг',
    level: 1,
    defaults: { options: 3 },
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="34" cy="60" r="24" fill="none" stroke="#5b8def" stroke-width="7"/>
      <circle cx="88" cy="60" r="26" fill="#ffa726"/>
    </svg>`,

    // 1 — коло, 2 — круг, 3 — круглий предмет, 4 — обвести коло, 5 — коло чи круг навмання.
    task(api, index) {
      if (index === 2) return roundThing(api);
      if (index === 3) return trace(api);
      const target = index === 0 ? 'коло' : index === 1 ? 'круг' : Util.pick(['коло', 'круг']);
      const other = target === 'коло' ? 'круг' : 'коло';
      const distractors = Util.shuffle(Object.keys(FIGURES).filter(f => f !== 'коло' && f !== 'круг'));
      const types = Util.shuffle([target, other, ...distractors].slice(0, api.settings.options));
      const colors = Util.shuffle(Util.COLORS);
      const buttons = types.map((type, i) => {
        const b = api.el('button', 'obj shape',
          `<svg viewBox="0 0 100 100" aria-hidden="true">${FIGURES[type](colors[i])}</svg>`);
        b.setAttribute('aria-label', 'Фігура');
        b.style.setProperty('--shape-transform', `scale(${(Util.randInt(60, 100) / 100).toFixed(2)})`);
        return b;
      });
      const field = api.el('div', 'field');
      field.append(...buttons);
      api.area.append(field);
      api.instruct('Покажи ' + target);
      api.choose(buttons, buttons[types.indexOf(target)]);
    },
  });

  function roundThing(api) {
    const things = Util.shuffle([Util.pick(ROUND), ...Util.shuffle(NOT_ROUND).slice(0, api.settings.options - 1)]);
    const buttons = things.map(e => api.el('button', 'obj shape', Util.emoji(e)));
    const field = api.el('div', 'field');
    field.append(...buttons);
    api.area.append(field);
    api.instruct('Покажи круглий предмет');
    api.choose(buttons, buttons[things.findIndex(e => ROUND.includes(e))]);
  }

  // Крапки по колу: учень торкається їх по черзі, між ними малюється лінія — виходить коло.
  function trace(api) {
    const R = 150;
    const pts = Array.from({ length: DOTS }, (_, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / DOTS;
      return [200 + R * Math.cos(a), 200 + R * Math.sin(a)];
    });
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('class', 'figure');
    svg.innerHTML = `<circle cx="200" cy="200" r="${R}" class="trace-guide"/><path class="trace-line" d=""/>`;
    const line = svg.querySelector('.trace-line');
    const wrap = api.el('div', 'trace');
    wrap.append(svg);

    let done = 0;
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    const arcTo = ([x, y]) => { d += ` A${R} ${R} 0 0 1 ${x} ${y}`; line.setAttribute('d', d); };
    const dots = pts.map(([x, y], i) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', i === 0 ? 'trace-dot next' : 'trace-dot');
      g.innerHTML = `<circle cx="${x}" cy="${y}" r="46" class="trace-hit"/>
        <circle cx="${x}" cy="${y}" r="24" class="trace-mark"/>
        <text x="${x}" y="${y + 10}" class="trace-n">${i + 1}</text>`;
      g.addEventListener('click', () => {
        if (i !== done) return;
        g.classList.replace('next', 'done');
        if (i > 0) arcTo(pts[i]);
        done++;
        api.say(String(done));
        if (done < DOTS) return dots[done].classList.add('next');
        arcTo(pts[0]);
        api.later(() => api.success(wrap), 500);
      });
      svg.append(g);
      return g;
    });
    api.area.append(wrap);
    api.instruct('Обведи коло');
  }
})();
