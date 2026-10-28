/* Shared server/browser quote. Charges apply to one immutable gift, never an account. */
(() => {
 const quote=(gift,plan='hour')=>{
  const items=window.LoveCatalog.products.filter(p=>p.type==='animal'?p.asset===gift.animal:p.type==='background'?p.asset===gift.background:gift.flowers.some(f=>f.id===p.asset)).map(p=>({id:p.id,name:p.name,amountMinor:p.amountMinor}));
  const includedMonth=items.length>0,month=includedMonth||plan==='month';
  if(month&&!includedMonth)items.push({id:'link-30-days',name:'เก็บลิงก์ของขวัญ 30 วัน',amountMinor:1900});
  return {items,amountMinor:items.reduce((n,p)=>n+p.amountMinor,0),currency:'thb',hours:month?720:1,plan:month?'month':'hour',includedMonth};
 };
 window.GiftPricing={quote};
})();
