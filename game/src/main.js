// SOLMAR HEAT boots a deterministic coastal sandbox and advances its systems at a fixed frame cap.
import { seededRandom } from './random.js';
import { createInput } from './input.js';
import { createPlayer, movePlayer, damagePlayer } from './player.js';
import { createTraffic, enterNearestCar, exitCar, updateCars, improveTraffic } from './vehicles.js';
import { createPedestrians, updatePedestrians, punchNearby } from './pedestrians.js';
import { createWanted, updatePolice, clearWanted } from './police.js';
import { createMissions, updateMissions, nextMission, restartMission, doSideWork } from './missions.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { loadSave, storeSave } from './save.js';
import { DISTRICTS, GARAGE, SAFEHOUSE, WORLD } from './city.js';

const STEP=1/60, MAX_FRAME=.08;
const canvas=document.getElementById('game'), status=document.getElementById('status');
const params=new URLSearchParams(location.search);
const seedValue=Number.parseInt(params.get('seed')||'614',10);
const random=seededRandom(Number.isInteger(seedValue)?seedValue:614);
const input=createInput(canvas), renderer=createRenderer(canvas), audio=createAudio();
const saved=loadSave();
const player=createPlayer(); player.health=100; player.ammo=18; player.hasWeapon=false;

function particleSystem(){return {items:[],burst(x,y,color,count){for(let i=0;i<count;i++){const angle=random()*Math.PI*2,speed=25+random()*110;this.items.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:2+random()*4,color,life:.25+random()*.55});}},step(dt){for(const item of this.items){item.x+=item.vx*dt;item.y+=item.vy*dt;item.life-=dt;}this.items=this.items.filter(item=>item.life>0);}};}
const state={player,cars:createTraffic(random),peds:createPedestrians(random),wanted:null,missions:createMissions(saved.mission),cash:saved.cash,packages:[],packagesFound:saved.packages||0,safehouse:!!saved.safehouse,bestCar:!!saved.bestCar,hasContinue:saved.cash!==450||saved.mission>0,menuIndex:saved.cash!==450||saved.mission>0?1:0,skids:[],roadblocks:[],particles:particleSystem(),shake:0,clock:17*60+12,screen:'title',taxiActive:false,taxiTarget:null,unlockNotice:'',unlockNoticeTimer:0,weapon:{x:1425,y:1055,taken:false},audio,save:()=>storeSave(state)};
state.wanted=createWanted(state);
if(saved.mission===2){state.wanted.heat=60;state.wanted.level=3;state.wanted.sight=7;}
for(const car of state.cars){car.x=Math.round(car.x);car.y=Math.round(car.y);}
state.cars.unshift({id:'starter-sedan',type:'sedan',color:'#d8d2b9',x:1365,y:1080,angle:0,speed:0,player:false,occupied:false});
for(const [x,y] of [[620,420],[2360,910],[1180,1630],[1810,430],[940,1120],[2650,1280]])state.packages.push({x,y,taken:false});
improveTraffic(state);
const shot=params.get('shot');
let screen='title', acc=0,last=performance.now(), missionToast=0, endHandled=false;

function stage(name){
  state.screen='play'; screen='play'; state.player.x=1420;state.player.y=1080;state.player.car=null;state.cash=1840;state.player.ammo=14;state.player.health=86;
  state.district=districtName(state.player.x,state.player.y);
  state.missions=createMissions(name==='mission'?1:0);state.missions.active=true;
  if(name==='mission'){state.player.x=1630;state.player.y=1060;state.player.car=state.cars.find(car=>car.type==='sport')||null;if(!state.player.car){const c={id:901,type:'sport',color:'#d95443',x:1630,y:1060,angle:0,speed:118,player:true,occupied:true};state.cars.push(c);state.player.car=c;}state.player.car.x=1630;state.player.car.y=1060;state.player.car.angle=.05;state.player.car.speed=118;state.wanted.heat=20;state.wanted.level=1;state.missions.timer=48;}
  if(name==='chase'){
    state.player.x=1910;state.player.y=1130;state.player.car={id:902,type:'sport',color:'#d95443',x:1910,y:1130,angle:0.02,speed:176,player:true,occupied:true};state.cars.push(state.player.car);
    state.wanted.heat=58;state.wanted.level=3;state.wanted.sight=7;
    for(const cop of [{x:1650,y:1138,angle:0},{x:1510,y:1070,angle:.12},{x:1700,y:1250,angle:-.2}])state.cars.push({...cop,id:`shot-cop-${state.cars.length}`,type:'police',color:'#e7e5dc',speed:139,player:false,occupied:false,police:true});
    state.missions=createMissions(2);state.missions.active=true;
  }
  if(name==='street'){state.player.x=1430;state.player.y=1050;state.wanted.heat=0;state.wanted.level=0;}
  if(name==='start'){screen='title';state.screen='title';}
  renderer.draw(state,screen);window.__shotReady=true;
}

function districtName(x,y){return DISTRICTS.find(d=>x>=d.x&&x<d.x+d.w&&y>=d.y&&y<d.y+d.h)?.name||'SOLMAR';}
function nearestPed(){return state.peds.find(p=>p.alive&&!p.officer&&Math.hypot(p.x-state.player.x,p.y-state.player.y)<410);}
function shoot(){
  if(!state.player.hasWeapon||state.player.ammo<=0)return;
  state.player.ammo--;audio.play('shot');state.shake=Math.max(state.shake,3);state.wanted.raise(1);
  const target=nearestPed();
  if(target){target.hp=(target.hp||1)-1;if(target.hp<=0){target.alive=false;state.cash+=35;state.particles.burst(target.x,target.y,'#db8a63',8);}}
}
function hitRival(){const target=state.peds.find(p=>p.rival&&p.alive&&Math.hypot(p.x-state.player.x,p.y-state.player.y)<48);if(target){target.hp=(target.hp||2)-1;state.audio.play('punch');state.particles.burst(target.x,target.y,'#ce7656',5);if(target.hp<=0)target.alive=false;}else punchNearby(state);}
function respawn(reason){screen=reason;state.screen=reason;state.player.health=0;state.player.car=null;state.cash=Math.max(0,state.cash-350);state.wanted.heat=0;state.wanted.level=0;state.cars=state.cars.filter(car=>!car.police);state.player.x=1260;state.player.y=1160;state.player.health=100;state.player.ammo=Math.max(0,state.player.ammo);state.player.invulnerable=2;state.save();}
function checkUnlocks(){
  if(!state.safehouse&&state.cash>=1200){state.safehouse=true;state.unlockNotice='PALMA COURT SAFEHOUSE UNLOCKED';state.unlockNoticeTimer=6;state.save();}
  if(!state.bestCar&&state.cash>=2500){
    state.bestCar=true;improveTraffic(state);
    state.cars.push({id:'garage-sport-a',type:'sport',color:'#d95443',x:375,y:205,angle:Math.PI/2,speed:0,player:false,occupied:false});
    state.cars.push({id:'garage-sport-b',type:'sport',color:'#67a9a1',x:625,y:205,angle:Math.PI/2,speed:0,player:false,occupied:false});
    state.unlockNotice='GLASS MILE SPORTS ADDED TO TRAFFIC';state.unlockNoticeTimer=6;state.save();
  }
}
function act(){
  if(screen==='title'){
    if(input.hit('ArrowUp','KeyW'))state.menuIndex=0;
    if(input.hit('ArrowDown','KeyS'))state.menuIndex=1;
    const confirm=input.hit('Enter')||input.clicked();
    if(confirm&&!(state.menuIndex===1&&!state.hasContinue)){
      audio.unlock();
      if(state.menuIndex===0){state.cash=450;state.packagesFound=0;state.missions=createMissions(0);state.hasContinue=false;state.player.health=100;state.player.ammo=18;state.player.hasWeapon=false;}
      state.player.x=1420;state.player.y=1080;state.missions.active=true;state.screen=screen='play';
    }
    return;
  }
  if(input.hit('Enter')){
    audio.unlock();
    if(screen==='mission-complete'){nextMission(state);screen=state.screen='play';}
    else if(screen==='mission-failed'){restartMission(state);screen=state.screen='play';}
    else if(screen==='busted'||screen==='wasted'){screen=state.screen='play';state.player.health=100;state.player.x=1260;state.player.y=1160;state.player.invulnerable=1.5;}
    else if(screen==='play'&&state.missions.complete){screen=state.screen='mission-complete';}
  }
  if(input.hit('Escape','KeyP'))screen=state.screen=screen==='paused'?'play':screen==='play'?'paused':screen;
  if(screen!=='play')return;
  if(input.hit('KeyE')){if(state.player.car)exitCar(state);else enterNearestCar(state);}
  if(input.hit('KeyF')){hitRival();}
  if(input.hit('KeyT'))doSideWork(state);
  if(input.hit('KeyG')&&clearWanted(state))missionToast=1.5;
  if(input.hit('KeyQ')&&state.safehouse&&Math.hypot(state.player.x-SAFEHOUSE.x,state.player.y-SAFEHOUSE.y)<110&&state.cash>=150){state.cash-=150;state.player.health=100;state.player.ammo=18;state.player.hasWeapon=true;state.save();missionToast=2;state.unlockNotice='PALMA COURT GARAGE / SERVICE PAID';state.unlockNoticeTimer=3;}
  if(input.firing())shoot();
  if(state.player.car && state.player.car.type==='taxi' && input.hit('KeyH'))doSideWork(state);
}
function step(dt){
  if(screen!=='play'){state.clock+=dt;return;}
  state.clock+=dt;state.district=districtName(state.player.x,state.player.y);
  movePlayer(state,input,dt);updateCars(state,input,dt);updatePedestrians(state,dt,random);updatePolice(state,dt,random);
  if(state.wanted.level>0){audio.siren(true);if(state.player.car&&state.cars.some(car=>car.police&&Math.hypot(car.x-state.player.x,car.y-state.player.y)<38)){state.player.car.speed*=.75;state.shake=8;state.wanted.raise(.12);}}
  else audio.siren(false);
  state.particles.step(dt);state.shake=Math.max(0,state.shake-dt*19);missionToast=Math.max(0,missionToast-dt);
  if(state.taxiActive&&state.taxiTarget&&Math.hypot(state.player.x-state.taxiTarget.x,state.player.y-state.taxiTarget.y)<100){state.cash+=350;state.taxiActive=false;state.taxiTarget=null;audio.play('mission');state.save();}
  if(!state.weapon.taken&&Math.hypot(state.player.x-state.weapon.x,state.player.y-state.weapon.y)<25){state.weapon.taken=true;state.player.hasWeapon=true;state.player.ammo=18;audio.play('pickup');}
  updateMissions(state,dt);state.player.cash=state.cash;
  checkUnlocks();state.unlockNoticeTimer=Math.max(0,state.unlockNoticeTimer-dt);
  if(state.missions.complete)screen=state.screen='mission-complete';
  if(state.missions.failed)screen=state.screen='mission-failed';
  if(state.player.caught){state.player.caught=false;respawn('busted');}
  if(state.player.health<=0)respawn('wasted');
}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(MAX_FRAME,Math.max(0,(now-last)/1000));last=now;act();acc+=dt;if(screen==='play'){while(acc>=STEP){step(STEP);acc-=STEP;}}else acc=0;renderer.draw(state,screen);input.finish();}

if(shot){stage(['start','street','mission','chase'].includes(shot)?shot:'start');}else{state.screen=screen='title';renderer.draw(state,screen);requestAnimationFrame(frame);}
canvas.addEventListener('pointerdown',()=>audio.unlock(),{once:true});
status.textContent='SOLMAR HEAT. Enter starts or continues the shift.';
