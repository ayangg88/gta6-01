import { isBlocked, WORLD } from './city.js';

export function createPlayer() {
  return { x: 1420, y: 1080, angle: 0, health: 100, ammo: 18, cash: 450, car: null, invulnerable: 0, punch: 0 };
}

export function movePlayer(state, input, dt) {
  const p = state.player;
  if (p.car) return;
  let dx = (input.down('KeyD','ArrowRight') ? 1 : 0) - (input.down('KeyA','ArrowLeft') ? 1 : 0);
  let dy = (input.down('KeyS','ArrowDown') ? 1 : 0) - (input.down('KeyW','ArrowUp') ? 1 : 0);
  const length = Math.hypot(dx, dy) || 1;
  const speed = input.down('ShiftLeft','ShiftRight') ? 238 : 158;
  dx = dx / length * speed * dt; dy = dy / length * speed * dt;
  if (!isBlocked(p.x + dx, p.y)) p.x += dx;
  if (!isBlocked(p.x, p.y + dy)) p.y += dy;
  if (dx || dy) p.angle = Math.atan2(dy, dx);
  p.x = Math.max(16, Math.min(WORLD.width - 16, p.x));
  p.y = Math.max(16, Math.min(WORLD.height - 16, p.y));
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.punch = Math.max(0, p.punch - dt);
}

export function damagePlayer(state, amount) {
  if (state.player.invulnerable > 0) return false;
  state.player.health = Math.max(0, state.player.health - amount);
  state.player.invulnerable = 0.65;
  return true;
}
