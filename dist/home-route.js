/* Preserve existing create links and legacy gift links before Home paints. */
(() => {
 if(location.pathname!=='/')return;
 if(location.hash.startsWith('#gift=')){location.replace('/make'+location.hash);return;}
 if(new URLSearchParams(location.search).get('create')==='1')location.replace('/make?create=1');
})();
