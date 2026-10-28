/* Choose the public gift view before the first paint; never load account UI there. */
(() => {
 const isRecipient=()=>location.pathname==='/g'||location.hash.startsWith('#gift=');
 const isCreate=()=>['/','/make'].includes(location.pathname)&&new URLSearchParams(location.search).get('create')==='1';
 document.documentElement.dataset.view=isRecipient()?'recipient':'maker';
 window.LoveRoute={isRecipient,isCreate};
})();
