import { choose } from './random.js';
import { isBlocked, WORLD } from './city.js';
import { damagePlayer } from './player.js';

const COATS = ['#f3b34d','#d56850','#69a7a2','#e5d6a7','#a8bdd2','#b86b91'];

export function createPedestrians(random, count = 42) {
  return Array.from({ length: count }, (_, id) => ({
    id, x: 240 + random() * 2460, y: 160 + random() * 1480,
    angle: random() * Math.PI * 2, speed: 18 + random() * 22,
    coat: choose(random, COATS), panic: 0, alive: true,
  }));
}

export function updatePedestrians(state, dt, random) {
  for (const ped of state.peds) {
    if (!ped.alive) continue;
    ped.panic = Math.max(0, ped.panic - dt);
    if (ped.rival || ped.officer) {
      const dx=state.player.x-ped.x,dy=state.player.y-ped.y,distance=Math.hypot(dx,dy);
      ped.angle=Math.atan2(dy,dx);
      if(distance>24){const speed=ped.officer?54:ped.rival?38:0;const nx=ped.x+Math.cos(ped.angle)*speed*dt,ny=ped.y+Math.sin(ped.angle)*speed*dt;if(!isBlocked(nx,ny,9)){ped.x=nx;ped.y=ny;}}
      ped.attack=(ped.attack||0)-dt;
      if(distance<29&&ped.attack<=0){ped.attack=ped.officer?1.1:.9;if(ped.officer&&!state.player.car)state.player.caught=true;else if(ped.rival)damagePlayer(state,8);state.shake=Math.max(state.shake,5);}
      continue;
    }
    if (random() < dt * 0.35) ped.angle += (random() - 0.5) * 1.7;
    const threat = state.player.car || state.wanted.level > 0;
    if (threat && Math.hypot(ped.x - state.player.x, ped.y - state.player.y) < 170) {
      ped.angle = Math.atan2(ped.y - state.player.y, ped.x - state.player.x); ped.panic = 2;
    }
    const speed = ped.speed * (ped.panic > 0 ? 3 : 1);
    const nx = ped.x + Math.cos(ped.angle) * speed * dt;
    const ny = ped.y + Math.sin(ped.angle) * speed * dt;
    if (isBlocked(nx, ny, 9)) ped.angle += Math.PI * (0.6 + random() * 0.8);
    else { ped.x = Math.max(10, Math.min(WORLD.width - 10, nx)); ped.y = Math.max(10, Math.min(1700, ny)); }
    if (state.player.car && Math.hypot(ped.x - state.player.car.x, ped.y - state.player.car.y) < 25 && Math.abs(state.player.car.speed) > 70) {
      ped.alive = false; state.wanted.raise(1); state.cash += 0; state.shake = 12;
      state.particles.burst(ped.x, ped.y, '#e69c6a', 8);
    }
  }
}

export function punchNearby(state) {
  const p = state.player;
  p.punch = 0.22;
  const target = state.peds.find(ped => ped.alive && Math.hypot(ped.x - p.x, ped.y - p.y) < 38);
  if (target) { target.alive = false; state.wanted.raise(1); state.particles.burst(target.x, target.y, '#e9bc8b', 7); }
}
