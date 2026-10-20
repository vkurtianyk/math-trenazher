'use strict';

(() => {
  // Спершу велика різниця, потім менша, наприкінці — «Порівну?».
  const plan = max => {
    const big = max === 10 ? [2, 8] : [1, 5];
    const small = max === 10 ? [4, 5] : [3, 4];
    const equal = Math.random() < 0.5;
    const n = Util.randInt(2, max === 10 ? 6 : 4);
    return [
      { q: 'more', counts: big },
      { q: 'less', counts: big },
      { q: 'more', counts: small },
      { q: 'less', counts: small },
      { q: 'equal', counts: equal ? [n, n] : [n, n + 3 <= max ? n + 3 : n - 2] },
    ];
  };

  const plate = (tag, count) => {
    const p = Util.el(tag, 'plate');
    const items = Util.el('div', 'plate-items');
    items.style.setProperty('--per-row', count > 6 ? 4 : count > 2 ? 3 : 2);
    for (let i = 0; i < count; i++) items.append(Util.el('span', 'item', Util.apple()));
    p.append(items);
    return p;
  };

  let tasks = [];

  registerGame({
    id: 'compare',
    block: 'oct',
    caption: 'Де більше?',
    defaults: { range: 10 },
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="30" cy="62" rx="27" ry="27" fill="#fff" stroke="#b0bec5" stroke-width="3"/>
      <ellipse cx="90" cy="62" rx="27" ry="27" fill="#fff" stroke="#b0bec5" stroke-width="3"/>
      <circle cx="30" cy="62" r="7" fill="#e57373"/>
      <circle cx="78" cy="52" r="7" fill="#e57373"/><circle cx="96" cy="50" r="7" fill="#e57373"/>
      <circle cx="84" cy="70" r="7" fill="#e57373"/><circle cx="102" cy="68" r="7" fill="#e57373"/>
    </svg>`,

    task(api, index) {
      if (index === 0) tasks = plan(api.settings.range);
      const t = tasks[index];
      const counts = Util.shuffle(t.counts);
      const field = api.el('div', 'field plates');
      api.area.append(field);

      if (t.q === 'equal') {
        field.append(plate('div', counts[0]), plate('div', counts[1]));
        const yes = api.el('button', 'card thumb', '👍');
        const no = api.el('button', 'card thumb', '👎');
        yes.setAttribute('aria-label', 'Так');
        no.setAttribute('aria-label', 'Ні');
        api.choicesEl.append(yes, no);
        api.instruct('porivnu');
        api.choose([yes, no], counts[0] === counts[1] ? yes : no);
        return;
      }

      const plates = counts.map(c => plate('button', c));
      field.append(...plates);
      const want = t.q === 'more' ? Math.max(...counts) : Math.min(...counts);
      api.instruct(t.q === 'more' ? 'pokazhy-de-bilshe' : 'pokazhy-de-menshe');
      api.choose(plates, plates[counts.indexOf(want)]);
    },
  });
})();
