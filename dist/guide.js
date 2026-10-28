/* Public, read-only picture guide. It never loads account or gift APIs. */
(() => {
  'use strict';
  const pages=[...document.querySelectorAll('[data-guide-page]')],links=[...document.querySelectorAll('.guide-toc a')];
  const prev=document.querySelector('#guide-prev'),next=document.querySelector('#guide-next'),dialog=document.querySelector('#guide-image-dialog');
  let current=0,imageOpener=null;
  const fromHash=()=>{const match=/^#page-([1-6])$/.exec(location.hash);return match?Number(match[1])-1:0;};
  function render(focus=false){
    current=fromHash();pages.forEach((page,i)=>{page.hidden=i!==current;});links.forEach((link,i)=>{if(i===current)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});
    prev.disabled=current===0;next.disabled=current===pages.length-1;next.textContent=current===pages.length-1?'อ่านครบแล้ว ♡':'หน้าถัดไป';
    document.querySelector('#guide-page-count').textContent=`${current+1} / ${pages.length}`;
    document.querySelector('#guide-page-status').textContent=`หน้า ${current+1} จาก ${pages.length} · ${links[current].textContent.trim().replace(/^0\d\s*/, '')}`;
    document.querySelector('#guide-progress-fill').style.width=`${(current+1)/pages.length*100}%`;
    document.title=`คู่มือ หน้า ${current+1}/${pages.length} · ความในใจภายในตุ๊กตา`;
    if(focus){if(dialog.open)dialog.close();pages[current].querySelector('h2').focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});}
  }
  function go(index){if(index<0||index>=pages.length)return;location.hash=`page-${index+1}`;}
  prev.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));
  document.querySelector('.skip-link')?.addEventListener('click',e=>{e.preventDefault();pages[current].querySelector('h2').focus({preventScroll:true});pages[current].scrollIntoView({block:'start',behavior:'auto'});});
  window.addEventListener('hashchange',()=>render(true));
  document.addEventListener('keydown',e=>{if(dialog.open||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key==='ArrowRight'&&current<pages.length-1){e.preventDefault();go(current+1);}else if(e.key==='ArrowLeft'&&current>0){e.preventDefault();go(current-1);}});
  document.querySelectorAll('[data-guide-image]').forEach(button=>button.addEventListener('click',()=>{const image=button.querySelector('img'),expanded=document.querySelector('#guide-expanded-image');expanded.src=image.getAttribute('src');expanded.alt=image.alt;document.querySelector('#guide-image-title').textContent=(button.getAttribute('aria-label')||image.alt).replace(/^ขยาย/,'');imageOpener=button;dialog.showModal();}));
  document.querySelector('#guide-image-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.querySelector('#guide-expanded-image').removeAttribute('src');imageOpener?.focus({preventScroll:true});});
  const P=window.PixelLove,gift={animal:'rabbit',bodyColor:'#f1dfce',outfit:'cardigan',outfitColor:'#c48e9b',hat:'bow',glasses:'none',flowers:[{id:'tulip',color:'#d990a6'}],wrapColor:'#ead4bd',ribbonColor:'#b96e83'};
  document.querySelectorAll('[data-guide-doll]').forEach(canvas=>P.draw(canvas,gift));
  document.querySelectorAll('[data-guide-gift]').forEach(canvas=>P.gift(canvas,canvas.dataset.guideGift));
  document.documentElement.classList.add('guide-ready');render();
})();
