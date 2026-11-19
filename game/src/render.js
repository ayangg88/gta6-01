import { DISTRICTS, GARAGE, SAFEHOUSE, WORLD, buildingAt } from './city.js';
import { carType } from './vehicles.js';
import { createHud } from './hud.js';

const W=1280,H=720;
const COLORS={ink:'#182a2c',paper:'#f6edcf',mint:'#96d4bd',red:'#e66550',gold:'#edc457'};

export function createRenderer(canvas) {
  const ctx=canvas.getContext('2d'); const camera={x:0,y:0};
  function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  function text(str,x,y,size=14,color=COLORS.paper,weight=600,align='left'){ctx.font=`${weight} ${size}px system-ui, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(str,x,y);}
  const hud=createHud(ctx,roundRect,text);
  function worldBackground(state){
    ctx.fillStyle='#526f59';ctx.fillRect(0,0,WORLD.width,WORLD.height);
    for(const district of DISTRICTS){ctx.fillStyle=district.color;ctx.fillRect(district.x,district.y,district.w,district.h);}
    ctx.fillStyle='#256d75';ctx.fillRect(2260,0,740,2200);ctx.fillStyle='#327e85';ctx.fillRect(2310,0,690,2200);
    ctx.fillStyle='#e8ddc2';ctx.fillRect(0,1740,2160,460);ctx.fillStyle='#c5ad72';ctx.fillRect(0,1810,2070,390);
    ctx.fillStyle='#f4d478';ctx.beginPath();ctx.arc(2860,165,43,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(250,241,204,.45)';ctx.lineWidth=3;for(let x=70;x<2200;x+=160){ctx.beginPath();ctx.moveTo(x,1880);ctx.quadraticCurveTo(x+30,1970,x-10,2070);ctx.stroke();}
    for(let y=55;y<1730;y+=250)for(let x=55;x<2220;x+=250){
      const cx=x+125,cy=y+125;if(buildingAt(cx,cy)){const h=((Math.floor(cx/250)*13+Math.floor(cy/250)*7)%4+1);
        ctx.fillStyle='#344b48';ctx.fillRect(x+13,y+14,124,112);ctx.fillStyle=['#a79b7b','#b4a47f','#777e70','#8c9c8f'][h-1];ctx.fillRect(x+9,y+8,124,108);
        ctx.fillStyle='rgba(44,69,64,.45)';ctx.fillRect(x+17,y+16,106,8);ctx.fillStyle='rgba(219,201,157,.54)';for(let wy=y+34;wy<y+108;wy+=24)for(let wx=x+24;wx<x+125;wx+=26)ctx.fillRect(wx,wy,9,8);
      }
    }
    ctx.fillStyle='#39494a';
    for(let y=0;y<1740;y+=250){ctx.fillRect(0,y+69,WORLD.width,112);ctx.fillStyle='#8a8e78';for(let x=0;x<WORLD.width;x+=74){ctx.fillRect(x+28,y+122,28,4);}ctx.fillStyle='#39494a';}
    for(let x=0;x<WORLD.width;x+=250){ctx.fillRect(x+69,0,112,1740);ctx.fillStyle='#8a8e78';for(let y=0;y<1740;y+=74){ctx.fillRect(x+122,y+25,4,28);}ctx.fillStyle='#39494a';}
    ctx.fillStyle='#555451';ctx.fillRect(0,25,WORLD.width,65);ctx.fillRect(35,0,65,1740);ctx.fillRect(0,1690,WORLD.width,66);ctx.fillRect(2175,0,65,2200);
    ctx.fillStyle='#f0c857';for(let x=10;x<WORLD.width;x+=92){ctx.fillRect(x,56,48,3);ctx.fillRect(x,1721,48,3);}for(let y=10;y<1700;y+=92){ctx.fillRect(67,y,3,48);ctx.fillRect(2207,y,3,48);}
    for(let y=80;y<1700;y+=250)for(let x=80;x<2200;x+=250){ctx.fillStyle='rgba(31,44,42,.14)';ctx.fillRect(x+68,y+60,110,90);}
    drawSign(SAFEHOUSE.x-30,SAFEHOUSE.y-60,'PALMA COURT','#e0b85d');drawSign(GARAGE.x-80,GARAGE.y-70,'TIDELINE SPRAY','#df7059');
  }
  function drawSign(x,y,label,color){roundRect(x,y,130,27,3,'#192e30');text(label,x+65,y+14,10,color,800,'center');}
  function drawCar(car){
    const type=carType(car.type);ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.angle);
    ctx.fillStyle='rgba(21,28,27,.28)';ctx.fillRect(-20,-7,44,18);ctx.fillStyle=car.color||type.color;ctx.fillRect(-22,-10,42,19);
    ctx.fillStyle='#1f373c';ctx.fillRect(-6,-8,15,15);ctx.fillStyle='#91bfc0';ctx.fillRect(-3,-7,8,13);
    ctx.fillStyle='#292d2b';ctx.fillRect(-16,-12,8,4);ctx.fillRect(8,-12,8,4);ctx.fillRect(-16,9,8,4);ctx.fillRect(8,9,8,4);
    ctx.fillStyle='#f5e7ad';ctx.fillRect(17,-7,3,4);ctx.fillRect(17,3,3,4);
    if(car.police){ctx.fillStyle='#e7534f';ctx.fillRect(-3,-12,7,4);ctx.fillStyle='#66bcd0';ctx.fillRect(3,-12,5,4);}
    ctx.restore();
  }
  function drawPerson(person,state){
    ctx.fillStyle='rgba(20,28,26,.25)';ctx.beginPath();ctx.ellipse(person.x,person.y+5,8,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=person.coat||'#b85e43';ctx.beginPath();ctx.arc(person.x,person.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eacaa1';ctx.beginPath();ctx.arc(person.x+1,person.y-5,4,0,Math.PI*2);ctx.fill();
    if(person.rival){ctx.strokeStyle='#eb684f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(person.x,person.y,11,0,Math.PI*2);ctx.stroke();}
  }
  function drawPlayer(state){const p=state.player;if(p.car)return;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='rgba(12,20,19,.3)';ctx.beginPath();ctx.ellipse(0,6,11,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.invulnerable>0&&Math.floor(p.invulnerable*12)%2?'#f5cf82':'#d8684e';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f5d2a5';ctx.beginPath();ctx.arc(3,-5,5,0,Math.PI*2);ctx.fill();if(p.punch>0){ctx.strokeStyle='#f4d16e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,24,-.8,.8);ctx.stroke();}ctx.restore();}
  function drawPackages(state){for(const pack of state.packages)if(!pack.taken){ctx.fillStyle='#f3d24d';ctx.fillRect(pack.x-8,pack.y-8,16,16);ctx.strokeStyle='#fff3b2';ctx.strokeRect(pack.x-10,pack.y-10,20,20);}}
  function drawWorld(state){
    ctx.save();ctx.translate(-camera.x,-camera.y);worldBackground(state);
    for(const mark of state.skids){ctx.strokeStyle=`rgba(25,29,28,${Math.min(.45,mark.life*.4)})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mark.x,mark.y);ctx.lineTo(mark.x-Math.cos(mark.angle)*20,mark.y-Math.sin(mark.angle)*20);ctx.stroke();}
    for(const ped of state.peds)if(ped.alive)drawPerson(ped,state);
    for(const car of state.cars)drawCar(car);
    for(const block of state.roadblocks||[]){ctx.save();ctx.translate(block.x,block.y);ctx.rotate(block.angle);ctx.fillStyle='#d6c7a0';ctx.fillRect(-38,-7,76,14);ctx.fillStyle='#c95949';for(let stripe=-31;stripe<35;stripe+=18)ctx.fillRect(stripe,-7,8,14);ctx.restore();}
    drawPackages(state);drawPlayer(state);
    for(const particle of state.particles.items){ctx.globalAlpha=Math.max(0,particle.life);ctx.fillStyle=particle.color;ctx.fillRect(particle.x,particle.y,particle.size,particle.size);}
    ctx.globalAlpha=1;
    if(state.wanted.helicopter){const target=state.player.car||state.player;ctx.fillStyle='rgba(255,241,163,.1)';ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(target.x-150,target.y-320);ctx.lineTo(target.x+150,target.y-320);ctx.closePath();ctx.fill();ctx.fillStyle='#28393a';ctx.fillRect(target.x-11,target.y-320,22,10);}
    ctx.restore();
  }
  function draw(state,screen){
    const p=state.player;camera.x=Math.max(0,Math.min(WORLD.width-W,(p.x-W/2)));camera.y=Math.max(0,Math.min(WORLD.height-H,(p.y-H/2)));
    if(state.shake>0){camera.x+=(Math.random()-.5)*state.shake;camera.y+=(Math.random()-.5)*state.shake;}
    ctx.clearRect(0,0,W,H);
    if(screen==='title'){
      worldBackground(state);ctx.save();ctx.translate(-camera.x,-camera.y);
      for(const car of state.cars.slice(0,10))drawCar(car);
      for(const ped of state.peds.slice(0,12))drawPerson(ped,state);
      ctx.restore();
      const newLabel=state.menuIndex===0?'▶  NEW SHIFT':'NEW SHIFT';
      const continueLabel=state.menuIndex===1?'▶  CONTINUE':'CONTINUE';
      hud.panel('SOLMAR HEAT','A coastal city remembers every favor.',[
        newLabel,
        state.hasContinue?continueLabel:'CONTINUE  /  NO SAVED RUN',
        'UP / DOWN SELECT  •  ENTER OR CLICK CONFIRM',
      ]);
      return;
    }
    drawWorld(state);hud.bars(state);hud.map(state);
    if(screen==='paused')hud.panel('SHIFT PAUSED','The city keeps its place.',['ESC OR P  /  RETURN TO THE STREET','ENTER  /  CONTINUE']);
    else if(screen==='mission-complete')hud.panel('JOB CLEARED',state.missions.current?.title||'LAST LIGHT',['PAYMENT CLEARED  •  ENTER TO CONTINUE']);
    else if(screen==='mission-failed')hud.panel('JOB LOST','The window closed. Try again.',['ENTER  /  RESTART JOB']);
    else if(screen==='busted')hud.panel('BUSTED','The county took its cut.',['ENTER  /  BACK AT SOLMAR GENERAL']);
    else if(screen==='wasted')hud.panel('WASTED','The tide rolls on.',['ENTER  /  BACK AT SOLMAR GENERAL']);
  }
  return {draw};
}
