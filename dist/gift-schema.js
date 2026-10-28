/* Shared plain-data schema, bundled for browser and server without runtime evaluation. */
(() => {
 const P=window.PixelLove;const seg=new Intl.Segmenter('th',{granularity:'grapheme'});
 const chars=v=>[...seg.segment(String(v))].map(x=>x.segment);
 const take=(v,n)=>chars(typeof v==='string'?v:'').slice(0,n).join('');
 const validColor=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
 const color=(v,d)=>validColor(v)?v:d;
 const id=(v,list,d)=>list.some(x=>x.id===v)?v:d;
 const defaults=()=>({version:1,animal:'rabbit',name:'โมจิ',bodyColor:'#f1dfce',outfit:'cardigan',outfitColor:'#c48e9b',hat:'none',glasses:'none',customDesigns:{},flowers:[{id:'tulip',color:'#d990a6'}],wrapColor:'#ead4bd',ribbonColor:'#b96e83',from:'',to:'',title:'มีบางอย่างอยากบอกเธอ',message:'ขอบคุณที่เป็นความสบายใจในทุกวัน อยู่เป็นรอยยิ้มให้กันแบบนี้ไปนาน ๆ นะ ♡',musicUrl:'',songTitle:'',background:'paper'});
 function normalize(raw){const d=defaults();if(!raw||typeof raw!=='object'||Array.isArray(raw))return d;if(Array.isArray(raw.flowers))raw={...raw,flowers:raw.flowers.filter(f=>f&&P.flowers.some(p=>p.id===f.id))};const customDesigns=window.CustomWear.normalizeAll(raw.customDesigns);const wear=(k,list,fallback)=>raw[k]==='custom'&&customDesigns[k]?'custom':id(raw[k],list,fallback);return {...d,customDesigns,animal:id(raw.animal,P.animals,d.animal),name:take(raw.name??d.name,24),bodyColor:color(raw.bodyColor,d.bodyColor),outfit:wear('outfit',P.outfits,d.outfit),outfitColor:color(raw.outfitColor,d.outfitColor),hat:wear('hat',P.hats,d.hat),glasses:wear('glasses',P.glasses,d.glasses),flowers:Array.isArray(raw.flowers)&&raw.flowers.length?raw.flowers.slice(0,3).filter((f,i,a)=>f&&P.flowers.some(p=>p.id===f.id)&&a.findIndex(p=>p?.id===f.id)===i).map(f=>({id:f.id,color:color(f.color,P.flowers.find(p=>p.id===f.id).color)})):d.flowers,wrapColor:color(raw.wrapColor,d.wrapColor),ribbonColor:color(raw.ribbonColor,d.ribbonColor),from:take(raw.from,24),to:take(raw.to,24),title:take(raw.title??d.title,50),message:take(raw.message??d.message,100),musicUrl:take(raw.musicUrl,2048),songTitle:take(raw.songTitle,80),background:id(raw.background,P.backgrounds,d.background)};}
 window.GiftSchema={defaults,normalize,chars};
})();
