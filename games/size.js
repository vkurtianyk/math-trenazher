'use strict';

(() => {
  // Як сказати «Покажи великого / маленького …».
  const ANIMALS = [
    { e: '🐱', big: 'великого котика', small: 'маленького котика' },
    { e: '🐶', big: 'великого песика', small: 'маленького песика' },
    { e: '🐟', big: 'велику рибку', small: 'маленьку рибку' },
    { e: '🐘', big: 'великого слона', small: 'маленького слона' },
    { e: '🐢', big: 'велику черепаху', small: 'маленьку черепаху' },
    { e: '🐻', big: 'великого ведмедика', small: 'маленького ведмедика' },
    { e: '🦆', big: 'велику качечку', small: 'маленьку качечку' },
    { e: '🐰', big: 'великого зайчика', small: 'маленького зайчика' },
  ];
  // Розміри від найменшого до найбільшого (частка від повного).
  const SIZES = { 2: [0.4, 1], 3: [0.35, 0.65, 1], 4: [0.3, 0.5, 0.75, 1] };

  let lastAnimal = null;

  registerGame({
    id: 'size',
    block: 'extra',
    caption: 'Великий і маленький',
    defaults: { options: 2 },
    icon: '<span class="icon-emoji" aria-hidden="true">🐘<small>🐘</small></span>',

    task(api, index) {
      let animal;
      do { animal = Util.pick(ANIMALS); } while (animal === lastAnimal);
      lastAnimal = animal;
      const wantBig = index % 2 === 0;
      const sizes = SIZES[api.settings.options];
      const order = Util.shuffle(sizes);
      const buttons = order.map(s => {
        const b = api.el('button', 'obj sized', Util.emoji(animal.e));
        b.style.setProperty('--k', s);
        return b;
      });
      const field = api.el('div', 'field sizes');
      field.append(...buttons);
      api.area.append(field);
      api.instruct('Покажи ' + (wantBig ? animal.big : animal.small));
      const want = wantBig ? Math.max(...sizes) : Math.min(...sizes);
      api.choose(buttons, buttons[order.indexOf(want)]);
    },
  });
})();
