import { isBlocked, WORLD } from './city.js';
import { choose } from './random.js';

const TYPES = [
  { name:'sedan', color:'#d8d2b9', speed:100, value:0 }, { name:'taxi', color:'#e7b643', speed:105, value:0 },
  { name:'truck', color:'#668796', speed:75, value:0 }, { name:'sport', color:'#d95443', speed:154, value:0 },
  { name:'police', color:'#dfe6df', speed:138, value:0 },
];
export const carType = type => TYPES.find(item => item.name === type) || TYPES[0];

export function createTraffic(random, count = 26) {
  return Array.from({ length: count }, (_, id) => {
    const vertical = random() > 0.52;
    const offset = Math.floor(random() * 10) * 250 + 56;
    return { id, type: choose(random, TYPES.slice(0,4)).name, color: null,
      x: vertical ? offset : 120 + random() * 2740, y: vertical ? 120 + random() * 1500 : offset,
      angle: vertical ? (random() > .5 ? Math.PI/2 : -Math.PI/2) : (random() > .5 ? 0 : Math.PI),
      speed: 42 + random() * 45, player: false, occupied: false, horn: 0 };
  });
}

export function spawnPoliceCar(x, y, angle = 0) {
  return { id: `cop-${Math.random()}`, type:'police', color:null, x, y, angle, speed:0, player:false, occupied:false, police:true };
}

export function enterNearestCar(state) {
  if (state.player.car) return false;
  let closest = null; let distance = 66;
  for (const car of state.cars) {
    if (car.occupied || car.police) continue;
    const d = Math.hypot(car.x - state.player.x, car.y - state.player.y);
    if (d < distance) { distance = d; closest = car; }
  }
  if (!closest) return false;
  closest.occupied = true; closest.player = true; state.player.car = closest;
  state.player.x = closest.x; state.player.y = closest.y;
  state.wanted.raise(1); state.audio.play('steal'); return true;
}

export function exitCar(state) {
  const car = state.player.car;
  if (!car) return false;
  const sideX = car.x + Math.cos(car.angle + Math.PI/2) * 30;
  const sideY = car.y + Math.sin(car.angle + Math.PI/2) * 30;
  if (isBlocked(sideX, sideY, 10)) return false;
  state.player.x = sideX; state.player.y = sideY; state.player.angle = car.angle; car.player = false; car.occupied = false; state.player.car = null;
  return true;
}

export function updateCars(state, input, dt) {
  for (const car of state.cars) {
    if (car.player) {
      const type = carType(car.type);
      const throttle = (input.down('KeyW','ArrowUp') ? 1 : 0) - (input.down('KeyS','ArrowDown') ? 1 : 0);
      const steer = (input.down('KeyD','ArrowRight') ? 1 : 0) - (input.down('KeyA','ArrowLeft') ? 1 : 0);
      const handbrake = input.down('Space');
      car.speed += throttle * (throttle < 0 && car.speed > 10 ? 260 : 185) * dt;
      car.speed *= Math.max(0, 1 - (handbrake ? 2.1 : 0.42) * dt);
      car.speed = Math.max(-65, Math.min(type.speed, car.speed));
      car.angle += steer * (0.7 + Math.min(1, Math.abs(car.speed)/85) * 1.65) * dt * Math.sign(car.speed || 1);
      const nx = car.x + Math.cos(car.angle) * car.speed * dt;
      const ny = car.y + Math.sin(car.angle) * car.speed * dt;
      let collided = isBlocked(nx, ny, car.type === 'truck' ? 24 : 18);
      for (const other of state.cars) if (other !== car && Math.hypot(other.x - nx, other.y - ny) < 39) { collided = true; if (other.police) state.wanted.raise(1); }
      if(state.roadblocks?.some(block=>Math.hypot(block.x-nx,block.y-ny)<38))collided=true;
      if (collided) { car.speed *= -0.25; state.shake = Math.max(state.shake, 8); state.particles.burst(car.x, car.y, '#f4bb66', 5); }
      else { car.x = nx; car.y = ny; }
      if (handbrake && Math.abs(car.speed) > 80 && Math.random() < dt * 10) state.skids.push({x:car.x,y:car.y,angle:car.angle,life:1});
      state.player.x = car.x; state.player.y = car.y;
      state.audio.engine(Math.abs(car.speed) / type.speed);
    } else if (car.police) {
      const target = state.player.car || state.player;
      const wantedAngle = Math.atan2(target.y - car.y, target.x - car.x);
      let delta = ((wantedAngle - car.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      car.angle += Math.max(-1.8 * dt, Math.min(1.8 * dt, delta));
      car.speed = Math.min(180 + state.wanted.level * 13, car.speed + 55 * dt);
      const nx = car.x + Math.cos(car.angle) * car.speed * dt, ny = car.y + Math.sin(car.angle) * car.speed * dt;
      if (!isBlocked(nx, ny, 19) && !state.roadblocks?.some(block=>Math.hypot(block.x-nx,block.y-ny)<38)) { car.x = nx; car.y = ny; }
      if (Math.hypot(car.x-target.x, car.y-target.y) < 34 && !state.player.car) state.player.caught = true;
    } else {
      const type = carType(car.type); car.speed += (type.speed * 0.55 - car.speed) * dt * 0.6;
      const nx = car.x + Math.cos(car.angle) * car.speed * dt, ny = car.y + Math.sin(car.angle) * car.speed * dt;
      if (isBlocked(nx, ny, 17)) { car.angle += Math.PI; car.speed = 26; }
      else { car.x = (nx + WORLD.width) % WORLD.width; car.y = Math.max(60, Math.min(1700, ny)); }
    }
  }
  state.skids = state.skids.filter(mark => (mark.life -= dt) > 0);
}

export function improveTraffic(state) {
  if (state.bestCar) for (const car of state.cars) if (car.type === 'sedan' && !car.occupied) car.type = 'sport';
}
