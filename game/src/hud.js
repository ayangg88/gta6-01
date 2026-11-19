import { WORLD } from './city.js';

const WIDTH=1280, HEIGHT=720;
const COLORS={paper:'#f6edcf',mint:'#96d4bd'};

export function createHud(ctx,roundRect,text){
  function map(state){
    const left=1040,top=22,width=218,height=164;
    const innerW=width-16,innerH=height-16;
    const sx=innerW/WORLD.width,sy=innerH/WORLD.height;
    roundRect(left,top,width,height,4,'rgba(16,37,39,.92)','#789291');
    ctx.save();ctx.translate(left+8,top+8);
    ctx.fillStyle='#6e845f';ctx.fillRect(0,0,innerW,innerH);
    ctx.fillStyle='#47818a';ctx.fillRect(158*sx,0,60*sx,innerH);
    ctx.fillStyle='#ddc985';ctx.fillRect(0,1740*sy,innerW,220*sy);
    ctx.fillStyle='#3f4945';
    for(let x=0;x<WORLD.width;x+=250)ctx.fillRect(x*sx,66*sy,112*sx,1660*sy);
    for(let y=0;y<1740;y+=250)ctx.fillRect(0,y*sy,innerW,112*sy);
    for(const car of state.cars){if(!car.police)continue;ctx.fillStyle='#ee5f50';ctx.fillRect(car.x*sx-2,car.y*sy-2,5,5);}
    const destination=state.taxiActive?state.taxiTarget:state.missions.marker;
    if(destination){ctx.fillStyle='#f5d05c';ctx.beginPath();ctx.arc(destination.x*sx,destination.y*sy,5,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#f6eee0';ctx.beginPath();ctx.arc(state.player.x*sx,state.player.y*sy,4.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
    text('SOLMAR',left+12,top+14,9,'#a4d1c1',800);
  }

  function bars(state){
    roundRect(22,21,278,101,4,'rgba(17,39,41,.9)');
    text(`SOLMAR  /  ${state.district||'COAST'}`,38,41,11,'#9ac8b9',800);
    text(`$${state.cash.toLocaleString('en-US')}`,38,70,23,COLORS.paper,800);
    text('VITALS',38,100,9,'#b3beb0',700);
    roundRect(91,92,188,13,2,'#344647');
    const vitality=Math.max(0,Math.min(1,state.player.health/100));
    roundRect(91,92,188*vitality,13,2,state.player.health<30?'#d9574b':'#72c79f');
    const wanted='★'.repeat(state.wanted.level)+'☆'.repeat(5-state.wanted.level);
    text(wanted,1018,42,20,state.wanted.level?'#ffcf55':'#a7afa2',800,'right');
    const hour=Math.floor(state.clock/60)%24,minute=Math.floor(state.clock%60);
    text(`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,1018,73,13,COLORS.paper,700,'right');
    if(state.player.car)text(`${Math.round(Math.abs(state.player.car.speed)*.62)} KM/H`,1018,103,16,'#f1d16e',800,'right');
    if(state.player.hasWeapon){
      roundRect(22,638,152,48,3,'rgba(17,39,41,.87)');
      text('SIDEARM',36,654,9,COLORS.mint,700);text(`${state.player.ammo}  /  18`,36,674,16,COLORS.paper,700);
    }
    const job=state.missions;
    if(job.active&&job.index<6){
      roundRect(348,22,570,75,4,'rgba(17,39,41,.92)');
      text(`JOB ${String(job.index+1).padStart(2,'0')}  /  ${job.current.title}`,366,42,11,'#f3c858',800);
      text(job.text,366,68,14,COLORS.paper,600);
      if(job.current.kind==='timed')text(`${Math.ceil(job.timer)}s`,896,69,13,'#ff806c',800,'right');
    }
    if(state.taxiActive)text('FARE  /  FOLLOW THE GOLD MARKER',640,133,12,'#f1d16e',800,'center');
    if(state.wanted.level>=4)text('ROADBLOCKS AHEAD',640,176,11,'#ef7761',800,'center');
  }

  function panel(title,subtitle,items=[]){
    ctx.fillStyle='rgba(7,20,23,.76)';ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle='#d9cfad';ctx.fillRect(0,0,WIDTH,355);
    ctx.fillStyle='#526f59';ctx.fillRect(0,355,WIDTH,365);
    ctx.fillStyle='#1b383b';ctx.fillRect(0,0,18,HEIGHT);ctx.fillRect(WIDTH-18,0,18,HEIGHT);
    text('SOLMAR  /  COASTAL COUNTY',640,128,13,'#a95b49',800,'center');
    text(title,640,231,60,'#1d3436',900,'center');
    text(subtitle,640,282,17,'#56625a',600,'center');
    for(let index=0;index<items.length;index++)text(items[index],640,440+index*33,15,'#f0e7ce',600,'center');
  }

  return {map,bars,panel};
}
