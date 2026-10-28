/* Keep settings in the current page so music and the gift draft stay in place. */
(() => {
 'use strict';
 const open=document.querySelector('#open-settings'),dialog=document.querySelector('#settings-dialog'),close=document.querySelector('#close-settings');
 if(!open||!dialog||!close)return;
 open.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();close.focus();});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>open.focus({preventScroll:true}));
 // The existing account handler opens its own dialog after this one closes.
 dialog.addEventListener('click',event=>{if(event.target.closest('#open-manage'))dialog.close();},true);
 const music=document.querySelector('#music-toggle'),state=document.querySelector('[data-settings-music-state]');
 const sync=()=>{if(!music||!state)return;state.textContent=music.dataset.state==='loading'?'กำลังเปิดเพลง…':music.dataset.state==='error'?'แตะเพื่อลองอีกครั้ง':music.dataset.state==='blocked'?'แตะเพื่อเริ่มเพลง':music.getAttribute('aria-pressed')==='true'?'กำลังเล่นเพลงเบา ๆ':'ปิดอยู่';};
 if(music)new MutationObserver(sync).observe(music,{attributes:true,attributeFilter:['aria-pressed','data-state']});sync();
})();
