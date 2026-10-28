/* Small, dependency-free interactions inspired by React Bits' Tilted Card,
   Bounce Cards and Magnet. Original implementation for this static prototype. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=false;try{paused=localStorage.getItem('doll-heart:motion-paused')==='true';}catch{}
  let enabled=!reduced.matches&&!paused,raf=0,last=0;
  const dolls=new Map(),animations=new Set();
  const observe=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const entry of entries){const d=dolls.get(entry.target);if(d)d.visible=entry.isIntersecting;}schedule();},{threshold:0.05}):null;
  const visible=d=>d.visible&&d.canvas.isConnected&&!d.canvas.closest('.hidden');
  function schedule(){if(!raf&&enabled&&!document.hidden&&[...dolls.values()].some(visible))raf=requestAnimationFrame(tick);}
  function tick(now){raf=0;if(!enabled||document.hidden)return;
    if(now-last>42){last=now;for(const [canvas,d] of dolls){if(!canvas.isConnected){observe?.unobserve(canvas);dolls.delete(canvas);continue;}if(!visible(d))continue;
      const t=(now-d.started)/1000,manual=(now-d.actionStart)/1000;
      const action=manual<2.7?d.action:(t%12<2.5?'wave':'idle');
      const pose={blink:t%4.7>4.52,bob:Math.round(Math.sin(t*2.4)*.8),tilt:0,wave:false};
      if(action==='wave'){pose.wave=true;pose.waveAngle=2.5+Math.sin((manual<2.7?manual:t)*12)*.32;}
      if(action==='dance'){pose.tilt=Math.sin(manual*10)*.065;pose.bob=-Math.round(Math.abs(Math.sin(manual*10))*5);pose.wave=true;pose.waveAngle=2.0+Math.sin(manual*10)*.4;}
      window.PixelLove.draw(canvas,d.state(),{pose});
    }}schedule();
  }
  function mount(canvas,state){if(!canvas)return;const old=dolls.get(canvas);if(old){old.state=state;schedule();return;}const d={canvas,state,visible:!observe,started:performance.now(),actionStart:-10000,action:'idle'};dolls.set(canvas,d);observe?.observe(canvas);if(!enabled)window.PixelLove.draw(canvas,state());schedule();}
  function act(canvas,action){const d=dolls.get(canvas);if(!d||!enabled)return;d.action=action;d.actionStart=performance.now();schedule();}
  function sync(){
    enabled=!reduced.matches&&!paused;document.documentElement.dataset.motion=enabled?'on':'off';
    const b=document.querySelector('#motion-toggle');if(b){b.disabled=reduced.matches;b.setAttribute('aria-pressed',String(enabled));b.setAttribute('aria-label',reduced.matches?'อุปกรณ์ตั้งค่าให้ลดการเคลื่อนไหว':enabled?'พักภาพเคลื่อนไหว':'เปิดภาพเคลื่อนไหว');b.title=reduced.matches?'อุปกรณ์ตั้งค่าให้ลดการเคลื่อนไหว':enabled?'พักภาพเคลื่อนไหว':'เปิดภาพเคลื่อนไหว';b.textContent=enabled?'Ⅱ':'▷';}
    document.querySelectorAll('[data-doll-action]').forEach(b=>{b.disabled=!enabled;b.title=!enabled?'เปิดภาพเคลื่อนไหวเพื่อลองเล่น':'';});
    if(!enabled){cancelAnimationFrame(raf);raf=0;for(const animation of animations)animation.cancel();animations.clear();for(const d of dolls.values())if(d.canvas.isConnected)window.PixelLove.draw(d.canvas,d.state());document.querySelectorAll('.confetti-burst').forEach(el=>el.remove());}else schedule();
  }
  function burst(host=document.body){if(!enabled)return;const wrap=document.createElement('div');wrap.className='confetti-burst';wrap.setAttribute('aria-hidden','true');for(let i=0;i<22;i++){const p=document.createElement('i');p.style.setProperty('--x',`${Math.sin(i*2.399)*(95+i*5)}px`);p.style.setProperty('--y',`${-90-Math.cos(i*1.7)*90}px`);p.style.setProperty('--end',`${120+i%5*20}px`);p.style.setProperty('--spin',`${i*67-330}deg`);p.style.setProperty('--delay',`${i%4*35}ms`);p.style.setProperty('--color',['#ca8094','#e5b8bb','#b8c6a2','#e5c382','#d8c7dd'][i%5]);wrap.appendChild(p);}host.appendChild(wrap);setTimeout(()=>wrap.remove(),2000);}
  function open(root,stage,signal){
    if(signal?.aborted)return Promise.resolve(false);if(!enabled)return Promise.resolve(true);
    return new Promise(resolve=>{let done=false;root.classList.add('opening');const duration=stage===0?1250:1600;
      const finish=ok=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(ok);};
      const abort=()=>finish(false),timer=setTimeout(()=>finish(true),duration);signal?.addEventListener('abort',abort,{once:true});
    });
  }
  // Delegation survives editor re-renders and never replaces the card's click handler.
  document.addEventListener('pointermove',e=>{if(!enabled||e.pointerType!=='mouse')return;const card=e.target.closest('.animal-card,.item-card,.flower-card,.preview-panel,.review-note,.recipient-letter');if(!card)return;const b=card.getBoundingClientRect();const x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;card.style.setProperty('--rx',`${(0.5-y)*7}deg`);card.style.setProperty('--ry',`${(x-0.5)*9}deg`);card.style.setProperty('--shine-x',`${x*100}%`);card.style.setProperty('--shine-y',`${y*100}%`);card.classList.add('tilting');});
  document.addEventListener('pointerout',e=>{const card=e.target.closest('.tilting');if(card&&!card.contains(e.relatedTarget)){card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');card.classList.remove('tilting');}});
  document.addEventListener('pointermove',e=>{if(!enabled||e.pointerType!=='mouse')return;const b=e.target.closest('.primary-button');if(!b)return;const rect=b.getBoundingClientRect();b.style.translate=`${(e.clientX-rect.left-rect.width/2)*.045}px ${(e.clientY-rect.top-rect.height/2)*.06}px`;});
  document.addEventListener('pointerout',e=>{const b=e.target.closest('.primary-button');if(b&&!b.contains(e.relatedTarget))b.style.translate='0 0';});
  document.addEventListener('click',e=>{const action=e.target.closest('[data-doll-action]');if(action){const canvas=action.closest('.preview-panel')?.querySelector('canvas:not(.scene-background)');act(canvas,action.dataset.dollAction);if(enabled&&action.dataset.dollAction==='dance')burst(action.closest('.preview-panel'));}
    const primary=e.target.closest('.primary-button');if(primary&&enabled){const a=primary.animate([{transform:'translateY(2px) scale(.97)'},{transform:'translateY(-2px) scale(1.025)'},{transform:'none'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});animations.add(a);a.finished.then(()=>animations.delete(a)).catch(()=>animations.delete(a));}
  });
  document.querySelector('#motion-toggle')?.addEventListener('click',()=>{if(reduced.matches)return;paused=!paused;try{localStorage.setItem('doll-heart:motion-paused',String(paused));}catch{}sync();});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});
  window.LoveMotion={mount,act,open,burst,sync,get enabled(){return enabled;}};sync();
})();
