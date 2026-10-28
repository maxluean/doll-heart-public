/* Animate the approved logo image in layers without changing its source artwork. */
(() => {
 'use strict';
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 function sync(){let paused=false;try{paused=localStorage.getItem('doll-heart:motion-paused')==='true';}catch{}document.documentElement.dataset.brandMotion=!media.matches&&!paused&&document.documentElement.dataset.motion!=='off'&&!document.hidden?'on':'off';}
 document.querySelectorAll('[data-brand-logo]').forEach((host,index)=>{
  const src=host.querySelector('img')?.getAttribute('src');if(!src)return;
  const key='brand-rabbit-'+index,image=`<image href="${src}" width="1254" height="1254"/>`;
  host.innerHTML=`<svg class="brand-rabbit-svg" viewBox="300 115 650 925" aria-hidden="true" focusable="false"><defs>
   <clipPath id="${key}-body"><path d="M300 405H581V383H673V405H950V1040H300Z"/></clipPath>
   <clipPath id="${key}-left"><rect x="375" y="125" width="253" height="281"/></clipPath>
   <clipPath id="${key}-right"><rect x="630" y="125" width="260" height="281"/></clipPath>
   <clipPath id="${key}-eyes"><rect x="486" y="560" width="57" height="64"/><rect x="711" y="560" width="57" height="64"/></clipPath>
   <mask id="${key}-face" maskUnits="userSpaceOnUse" x="300" y="115" width="650" height="925"><rect x="300" y="115" width="650" height="925" fill="white"/><rect x="486" y="560" width="57" height="64" fill="black"/><rect x="711" y="560" width="57" height="64" fill="black"/></mask>
  </defs><g class="brand-sway">
   <g clip-path="url(#${key}-body)" mask="url(#${key}-face)">${image}</g>
   <rect x="486" y="560" width="57" height="64" fill="#fff1de"/><rect x="711" y="560" width="57" height="64" fill="#fff1de"/>
   <g class="brand-eyes"><g clip-path="url(#${key}-eyes)">${image}</g></g>
   <g class="brand-ear brand-ear-left"><g clip-path="url(#${key}-left)">${image}</g></g>
   <g class="brand-ear brand-ear-right"><g clip-path="url(#${key}-right)">${image}</g></g>
  </g></svg>`;
 });
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
 media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);window.addEventListener('storage',event=>{if(event.key==='doll-heart:motion-paused')sync();});sync();
})();
