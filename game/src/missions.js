import { GARAGE, SAFEHOUSE } from './city.js';

const stories = [
  { title:'A CLEAN ARRIVAL', text:'Take a car to the marina drop.', target:{x:2530,y:1180}, kind:'drive' },
  { title:'BLUE HOUR RUN', text:'Deliver the sealed case before time runs out.', target:{x:440,y:1460}, kind:'timed', seconds:72 },
  { title:'NO QUIET EXIT', text:'Lose the three-star heat at Palma Court.', target:SAFEHOUSE, kind:'escape' },
  { title:'TIDE MARKS', text:'Collect three marked parcels around Solmar.', target:null, kind:'packages', count:3 },
  { title:'OLD DEBTS', text:'Break the Marrow Dogs crew on foot.', target:{x:600,y:1230}, kind:'fight', count:4 },
  { title:'LAST LIGHT', text:'Take the vault keys, reach the pier, then escape.', target:{x:2480,y:420}, kind:'heist', stage:0 },
];

export function createMissions(index = 0) {
  const selected=Math.max(0,Math.min(stories.length,index));
  return { index:selected, progress:0, timer:0, active:selected<stories.length, stage:0, failed:false, complete:false, current:stories[selected]?{...stories[selected],target:stories[selected].target?{...stories[selected].target}:null}:null,
    get text(){return this.current?.text || 'Solmar is yours. Take side work or explore.';},
    get marker(){ if (this.index === 3) return [{x:620,y:420},{x:2360,y:910},{x:1180,y:1630}][this.progress] || null; return this.current?.target || null; },
  };
}

function near(a,b,d=74) { return b && Math.hypot(a.x-b.x,a.y-b.y)<d; }

export function updateMissions(state, dt) {
  const mission = state.missions;
  if (!mission.active || mission.index >= stories.length) return;
  const task = mission.current;
  if (mission.complete || mission.failed) return;
  if (task.kind === 'timed' && mission.timer === 0) mission.timer = task.seconds;
  if (task.kind === 'timed') { mission.timer -= dt; if (mission.timer <= 0) { mission.failed = true; return; } }
  if (task.kind === 'drive' && state.player.car && near(state.player.car,task.target,105)) finish(state);
  if (task.kind === 'timed' && state.player.car && near(state.player.car,task.target,110)) finish(state);
  if (task.kind === 'escape' && state.wanted.level === 0 && near(state.player,SAFEHOUSE,150)) finish(state);
  if (task.kind === 'packages' && mission.progress >= task.count) finish(state);
  if (task.kind === 'fight') {
    if (!mission.spawned) {
      mission.spawned = true;
      for (let i=0;i<task.count;i++) state.peds.push({id:`marrow-${i}`,x:560+i*25,y:1210+(i%2)*30,angle:0,speed:0,coat:['#9c443b','#623c43','#b45b41','#634c38'][i],panic:0,alive:true,rival:true,hp:2});
    }
    if (near(state.player,task.target,160) && state.peds.filter(p=>p.rival&&p.alive).length === 0) finish(state);
  }
  if (task.kind === 'heist') {
    if (mission.stage===0 && near(state.player.car||state.player,task.target,100)) { mission.stage=1; mission.current.text='Grab the vault ledger at the east warehouse.'; mission.current.target={x:2750,y:900}; state.wanted.raise(2); }
    else if (mission.stage===1 && near(state.player,task.target,80)) { mission.stage=2; mission.current.text='Get the ledger to the beach rendezvous.'; mission.current.target={x:1280,y:1810}; state.cash += 900; state.particles.burst(state.player.x,state.player.y,'#edc957',22); }
    else if (mission.stage===2 && near(state.player.car||state.player,task.target,110)) finish(state);
  }
  for (const pack of state.packages) if (!pack.taken && near(state.player,pack,27)) { pack.taken=true; state.cash+=250; state.packagesFound++; state.audio.play('pickup'); state.particles.burst(pack.x,pack.y,'#f5d85a',10); if (task.kind==='packages') mission.progress++; }
}

function finish(state) {
  const mission=state.missions; mission.complete=true; mission.active=false; state.cash += 600 + mission.index*180; state.player.cash=state.cash;
  state.wanted.heat=Math.max(0,state.wanted.heat-16); state.audio.play('mission'); state.save();
}

export function nextMission(state) {
  if (!state.missions.complete) return false;
  const next=state.missions.index+1;
  state.missions=createMissions(next);
  if(next===2){state.wanted.heat=60;state.wanted.level=3;state.wanted.sight=7;state.wanted.copTimer=0;}
  state.save(); return true;
}

export function restartMission(state) {
  state.missions=createMissions(state.missions.index); state.player.health=100; state.missions.failed=false; state.missions.active=true;
}

export function doSideWork(state) {
  if (state.taxiActive) { state.taxiActive=false; state.cash += 350; state.audio.play('mission'); return true; }
  if (state.player.car?.type==='taxi') { state.taxiActive=true; state.taxiTarget={x:520,y:300}; return true; }
  return false;
}
