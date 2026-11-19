const HELD_KEYS = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space']);

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let pointerFire = false;
  let pointerClick = false;
  window.addEventListener('keydown', event => {
    if (HELD_KEYS.has(event.code) || ['KeyE','KeyF','KeyP','Enter','Escape'].includes(event.code)) event.preventDefault();
    if (!held.has(event.code)) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', event => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', event => { if (event.button === 0) { pointerFire = true; pointerClick = true; } });
  return {
    down(...codes) { return codes.some(code => held.has(code)); },
    hit(...codes) { return codes.some(code => pressed.has(code)); },
    firing() { const fire = pointerFire; pointerFire = false; return fire || this.hit('Space'); },
    clicked() { const click = pointerClick; pointerClick = false; if (click) pointerFire = false; return click; },
    finish() { pressed.clear(); },
  };
}
