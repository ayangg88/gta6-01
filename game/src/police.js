import { spawnPoliceCar } from './vehicles.js';

export function createWanted(state) {
  return {
    level: 0, heat: 0, sight: 0, copTimer: 0, footTimer: 0, roadblock: false, helicopter: false,
    raise(amount = 1) { this.heat = Math.min(100, this.heat + amount * 23); this.level = Math.min(5, Math.max(this.level, Math.ceil(this.heat / 20))); this.sight = 8; },
  };
}

export function updatePolice(state, dt, random) {
  const wanted = state.wanted;
  const player = state.player.car || state.player;
  let seen = false;
  for (const cop of state.cars.filter(car => car.police)) if (Math.hypot(cop.x-player.x, cop.y-player.y) < 470) seen = true;
  if (wanted.level > 0 && seen) { wanted.sight = 6; wanted.heat = Math.min(100, wanted.heat + dt * 1.7); }
  else if (wanted.sight > 0) wanted.sight -= dt;
  else if (wanted.level > 0) wanted.heat = Math.max(0, wanted.heat - dt * 5.6);
  wanted.level = Math.ceil(wanted.heat / 20);
  wanted.roadblock = wanted.level >= 4;
  wanted.helicopter = wanted.level >= 5;
  state.roadblocks = wanted.roadblock ? [{x:1060,y:1125,angle:0},{x:1810,y:820,angle:Math.PI/2}] : [];
  wanted.footTimer -= dt;
  if(wanted.level===1&&wanted.footTimer<=0&&!state.peds.some(p=>p.officer&&Math.hypot(p.x-player.x,p.y-player.y)<360)){
    const angle=random()*Math.PI*2;state.peds.push({id:`officer-${Math.floor(random()*99999)}`,x:player.x+Math.cos(angle)*250,y:player.y+Math.sin(angle)*250,angle:angle+Math.PI,speed:38,coat:'#243c50',panic:0,alive:true,officer:true});wanted.footTimer=3.5;
  }
  wanted.copTimer -= dt;
  if (wanted.level >= 2 && wanted.copTimer <= 0 && state.cars.filter(car=>car.police).length < wanted.level + 1) {
    const angle = random() * Math.PI * 2; const d = 540;
    state.cars.push(spawnPoliceCar(Math.max(30,Math.min(2970,player.x+Math.cos(angle)*d)),Math.max(30,Math.min(1700,player.y+Math.sin(angle)*d)),angle+Math.PI));
    wanted.copTimer = 5.5;
  }
  state.cars = state.cars.filter(car => !car.police || wanted.level > 0 || Math.hypot(car.x-player.x,car.y-player.y)<650);
}

export function clearWanted(state) {
  if (Math.hypot(state.player.x - 2710, state.player.y - 1520) > 110 || state.cash < 180) return false;
  state.cash -= 180; state.player.cash = state.cash; state.wanted.heat = 0; state.wanted.level = 0; state.wanted.sight = 0;
  state.cars = state.cars.filter(car => !car.police); state.audio.play('pickup'); state.save(); return true;
}
