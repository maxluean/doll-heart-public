/* Keep existing shared gift links working after moving the public site to Pages. */
(() => {
 'use strict';
 const previousOrigins=['https://doll-heart-eta.vercel.app','https://doll-heart.pages.dev'];
 if(!previousOrigins.includes(location.origin)||location.pathname.startsWith('/api/'))return;
 const next=new URL('https://specialdoll.pages.dev');
 next.pathname=location.pathname;
 next.search=location.search;
 next.hash=location.hash;
 location.replace(next.href);
})();
