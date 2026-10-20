'use strict';

(() => {
  // Тваринка, її їжа і як сказати «Нагодуй …».
  const ANIMALS = [
    { e: '🐰', food: '🥕', name: 'зайчика' },
    { e: '🐱', food: '🐟', name: 'котика' },
    { e: '🐶', food: '🦴', name: 'песика' },
    { e: '🐵', food: '🍌', name: 'мавпочку' },
    { e: '🐻', food: '🍯', name: 'ведмедика' },
    { e: '🐭', food: '🧀', name: 'мишку' },
    { e: '🐿️', food: '🌰', name: 'білочку' },
    { e: '🐔', food: '🌽', name: 'курочку' },
  ];

  let last = null;
  let lastAnimal = null;

  registerGame({
    id: 'feed',
    block: 'extra',
    caption: 'Нагодуй тваринку',
    defaults: { range: 5 },
    icon: '<span class="icon-emoji" aria-hidden="true">🐰<br>🥕🥕</span>',

    task(api) {
      const n = Util.freshInt(1, Math.min(6, api.settings.range), last);
      last = n;
      let animal;
      do { animal = Util.pick(ANIMALS); } while (animal === lastAnimal);
      lastAnimal = animal;
      const say = 'Нагодуй ' + animal.name;
      let busy = false;

      // Тваринка «просить»: у хмаринці цифра і стільки ж крапок.
      const scene = api.el('div', 'field feed-scene');
      const pet = api.el('div', 'pet', Util.emoji(animal.e));
      const wish = api.el('div', 'wish');
      wish.append(api.el('span', 'wish-n', String(n)));
      const dots = api.el('span', 'wish-dots');
      const dotEls = Array.from({ length: n }, () => api.el('span', 'wish-dot', Util.emoji(animal.food)));
      dots.append(...dotEls);
      wish.append(dots);
      const bowl = api.el('div', 'bowl');
      scene.append(pet, wish);

      const basket = api.el('div', 'box');
      for (let i = 0; i < Math.min(n + 3, 8); i++) {
        const b = api.el('button', 'obj item', Util.emoji(animal.food));
        b.addEventListener('click', () => {
          if (busy || api.locked) return;
          (b.parentElement === basket ? bowl : basket).append(b);
        });
        basket.append(b);
      }
      api.area.append(scene, bowl, basket);

      const done = api.el('button', 'card finish', '✔<small>Готово</small>');
      done.setAttribute('aria-label', 'Готово');
      api.choicesEl.append(done);
      done.addEventListener('click', () => {
        if (busy) return;
        if (bowl.children.length === n) return api.success(done, () => pet.classList.add('happy'));
        busy = true;
        api.countTogether([dotEls, [...bowl.children]], say, () => { busy = false; });
      });
      api.instruct(say);
    },
  });
})();
