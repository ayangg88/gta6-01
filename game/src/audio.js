export function createAudio() {
  let ctx=null, engineOsc=null, engineGain=null, sirenOsc=null, sirenGain=null;
  function boot() {
    if (ctx) return;
    try { ctx=new AudioContext(); engineOsc=ctx.createOscillator(); engineGain=ctx.createGain(); engineOsc.type='sawtooth'; engineGain.gain.value=0; engineOsc.connect(engineGain).connect(ctx.destination); engineOsc.start(); } catch { ctx=null; }
  }
  function tone(freq,duration,type='sine',volume=.08,slide=0) {
    boot(); if (!ctx) return;
    const osc=ctx.createOscillator(), gain=ctx.createGain(), now=ctx.currentTime;
    osc.type=type; osc.frequency.setValueAtTime(freq,now); if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),now+duration);
    gain.gain.setValueAtTime(volume,now); gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now+duration);
  }
  return {
    unlock:boot,
    play(name) {
      if(name==='pickup'){tone(660,.08,'sine',.07);setTimeout(()=>tone(990,.12,'sine',.055),75);}
      if(name==='shot')tone(105,.13,'square',.12,-65);
      if(name==='punch')tone(165,.07,'triangle',.08,-45);
      if(name==='mission'){tone(523,.13);setTimeout(()=>tone(659,.13),115);setTimeout(()=>tone(784,.24),230);}
      if(name==='steal')tone(225,.12,'triangle',.07,80);
    },
    engine(amount){ boot(); if(!ctx||!engineOsc)return; engineGain.gain.setTargetAtTime(amount*.018,ctx.currentTime,.08); engineOsc.frequency.setTargetAtTime(48+amount*115,ctx.currentTime,.06); },
    siren(on){boot();if(!ctx)return;if(on&&!sirenOsc){sirenOsc=ctx.createOscillator();sirenGain=ctx.createGain();sirenOsc.type='square';sirenGain.gain.value=.015;sirenOsc.connect(sirenGain).connect(ctx.destination);sirenOsc.start();}if(sirenOsc){sirenGain.gain.setTargetAtTime(on?.018:0,ctx.currentTime,.15);sirenOsc.frequency.setTargetAtTime(on?720:520,ctx.currentTime,.35);}},
  };
}
