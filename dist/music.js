/* One same-origin background track. Never fetches audio on the welcome page. */
(() => {
 'use strict';
 const intentKey='doll-heart:music-start',muteKey='doll-heart:music-muted';
 const read=(store,key)=>{try{return store.getItem(key);}catch{return null;}};
 const write=(store,key,value)=>{try{store.setItem(key,value);}catch{/* Private browsing can disable storage. */}};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const url=new URL(link.getAttribute('href'),location.origin);
  if(url.origin===location.origin&&url.pathname==='/make'&&url.searchParams.get('create')==='1')write(sessionStorage,intentKey,'1');
 },true);
 const button=document.querySelector('#music-toggle');if(!button)return;
 // The public source snapshot omits the separately licensed soundtrack.
 if(document.documentElement.dataset.musicDisabled==='true'){button.disabled=true;button.setAttribute('aria-label','ตัวอย่างซอร์สสาธารณะไม่ได้แนบไฟล์เพลง');button.title='Add your own licensed track to enable background music';return;}
 const recipient=()=>window.LoveRoute?.isRecipient()||document.documentElement.dataset.view==='recipient';
 let muted=read(localStorage,muteKey)==='1',wanted=!recipient()&&(read(sessionStorage,intentKey)==='1'||window.LoveRoute?.isCreate()===true);
 let audio=null,playing=false,pending=false,blocked=false,failed=false,version=0;
 if(wanted)write(sessionStorage,intentKey,'1');
 function sync(){
  const on=playing&&audio&&!audio.paused;
  const label=failed?'โหลดเพลงไม่สำเร็จ แตะเพื่อลองอีกครั้ง':on||pending?'ปิดเพลงพื้นหลัง':blocked?'แตะเพื่อเปิดเพลงพื้นหลัง':'เปิดเพลงพื้นหลัง';
  button.setAttribute('aria-pressed',String(!!on));button.setAttribute('aria-busy',String(pending));button.setAttribute('aria-label',label);
  button.title=label+' · Romantic – andriih';button.dataset.state=failed?'error':pending?'loading':on?'playing':blocked?'blocked':'off';button.disabled=recipient();
 }
 function ensureAudio(){
  if(audio)return audio;
  audio=document.createElement('audio');audio.id='background-music';audio.hidden=true;audio.loop=true;audio.preload='none';audio.volume=.22;audio.src='/audio/romantic-601649.mp3';
  audio.addEventListener('playing',()=>{playing=true;pending=false;blocked=false;failed=false;sync();});
  audio.addEventListener('pause',()=>{playing=false;sync();});
  audio.addEventListener('error',()=>{playing=false;pending=false;failed=true;sync();});
  document.body.append(audio);return audio;
 }
 function pause(){version++;pending=false;playing=false;audio?.pause();sync();}
 async function play(){
  if(!wanted||muted||recipient()||document.hidden||pending||playing)return;
  const attempt=++version;pending=true;failed=false;blocked=false;sync();
  try{await ensureAudio().play();if(attempt!==version||!wanted||muted||recipient()||document.hidden){if(!wanted||muted||recipient()||document.hidden)audio.pause();return;}playing=!audio.paused;}
  catch(error){if(attempt!==version)return;playing=false;blocked=error.name==='NotAllowedError';failed=!blocked&&error.name!=='AbortError';}
  finally{if(attempt===version){pending=false;sync();}}
 }
 button.addEventListener('click',()=>{
  if(playing||pending){wanted=false;muted=true;blocked=false;write(sessionStorage,intentKey,'0');write(localStorage,muteKey,'1');pause();}
  else{wanted=true;muted=false;write(sessionStorage,intentKey,'1');write(localStorage,muteKey,'0');play();}
 });
 // Retry a blocked navigation start in the next real gesture, without overriding mute.
 const retry=event=>{if(event.target.closest('#music-toggle,.song-card')||event.key&&['Shift','Control','Alt','Meta','Escape'].includes(event.key))return;if(wanted&&!muted&&blocked)play();};
 document.addEventListener('pointerdown',retry);document.addEventListener('keydown',retry);
 document.addEventListener('click',event=>{if(!event.target.closest('.song-card'))return;wanted=false;blocked=false;write(sessionStorage,intentKey,'0');pause();},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play();});
 window.addEventListener('pagehide',pause);
 window.addEventListener('pageshow',()=>play());
 window.addEventListener('storage',event=>{if(event.key!==muteKey)return;muted=event.newValue==='1';if(muted)pause();});
 new MutationObserver(()=>{if(recipient())pause();else{sync();play();}}).observe(document.documentElement,{attributes:true,attributeFilter:['data-view']});
 sync();if(wanted&&!muted)play();
})();
