'use strict';

(() => {
  const STEP = 900;
  let last = null;

  registerGame({
    id: 'give',
    block: 'oct',
    caption: 'Дай стільки ж',
    defaults: { range: 10 },
    icon: `<svg viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="30" cy="50" rx="26" ry="26" fill="#fff" stroke="#b0bec5" stroke-width="3"/>
      <ellipse cx="90" cy="50" rx="26" ry="26" fill="#fff" stroke="#b0bec5" stroke-width="3"/>
      <circle cx="22" cy="44" r="7" fill="#e57373"/><circle cx="38" cy="44" r="7" fill="#e57373"/><circle cx="30" cy="60" r="7" fill="#e57373"/>
      <circle cx="82" cy="50" r="7" fill="#e57373"/><circle cx="98" cy="50" r="7" fill="#e57373"/>
      <rect x="20" y="88" width="80" height="24" rx="4" fill="#d7ccc8" stroke="#a1887f" stroke-width="3"/>
    </svg>`,

    task(api) {
      const n = Util.freshInt(2, Math.min(6, api.settings.range), last);
      last = n;
      let busy = false;

      const plates = api.el('div', 'field plates');
      const target = api.el('div', 'plate give-plate');
      const mine = api.el('div', 'plate give-plate mine');
      const targetItems = Array.from({ length: n }, () => api.el('span', 'obj item', Util.apple()));
      target.append(...targetItems);
      plates.append(target, mine);

      const box = api.el('div', 'box');
      for (let i = 0; i < Math.min(n + 3, 8); i++) {
        const b = api.el('button', 'obj item', Util.apple());
        b.setAttribute('aria-label', 'Яблуко');
        b.addEventListener('click', () => {
          if (busy || api.locked) return;
          (b.parentElement === box ? mine : box).append(b);
        });
        box.append(b);
      }
      api.area.append(plates, box);

      const done = api.el('button', 'card finish', '✔<small>Готово</small>');
      done.setAttribute('aria-label', 'Готово');
      api.choicesEl.append(done);
      done.addEventListener('click', () => {
        if (busy) return;
        if (mine.children.length === n) return api.success(done);
        api.markHinted();
        countTogether();
      });
      api.instruct('dai-stilky-zh');

      // Підказка: предмети на обох тарілках по черзі отримують номер 1, 2, 3…
      function countTogether() {
        busy = true;
        api.instruct('porakhuimo-razom');
        const steps = [...targetItems, null, ...mine.children];
        let t = STEP * 1.5;
        let k = 0;
        for (const item of steps) {
          if (item === null) { k = 0; t += STEP; continue; }
          const num = ++k;
          api.later(() => { item.classList.add('hint'); item.dataset.n = num; }, t);
          t += STEP;
        }
        api.later(() => {
          for (const item of steps) {
            if (!item) continue;
            item.classList.remove('hint');
            delete item.dataset.n;
          }
          busy = false;
          api.instruct('dai-stilky-zh');
        }, t + STEP);
      }
    },
  });
})();
