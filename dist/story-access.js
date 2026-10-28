/* Paid story images require the matching gift and an active server read. */
(() => {
 const message='ชำระยอดของขวัญก่อน จึงจะดูและบันทึกภาพสตอรี่ได้';
 function create({quote,normalize,readGift,context,now=()=>Date.now()}){
  const fingerprint=gift=>JSON.stringify(normalize(gift));
  const required=(gift,c)=>quote(normalize(gift),c.plan||'hour').amountMinor>0;
  function allowed(gift){
   if(!gift)return false;const c=context();if(!required(gift,c))return true;
   if(c.recipientToken)return true;
   const r=c.receipt;return !!(r&&r.status==='paid'&&r.active===true&&r.fingerprint===fingerprint(gift)&&new Date(r.expiresAt).getTime()>now());
  }
  async function assert(gift){
   const c=context();if(!allowed(gift))throw new Error(message);if(!required(gift,c))return;
   let token=c.recipientToken;
   if(!token){try{const u=new URL(c.receipt.recipientUrl);if(u.origin!==c.origin||u.pathname!=='/g')throw new Error();token=u.hash.slice(1);}catch{throw new Error(message);}}
   if(!/^[A-Za-z0-9_-]{32}$/.test(token||''))throw new Error(message);
   try{const result=await readGift(token);if(fingerprint(result.gift)!==fingerprint(gift))throw new Error();}catch{throw new Error('ยืนยันสิทธิ์บันทึกภาพไม่ได้ ลิงก์อาจหมดอายุ ถูกถอน หรือยังไม่ชำระเงิน');}
  }
  return {allowed,assert,message};
 }
 window.StoryAccess={create};
})();
