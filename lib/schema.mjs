import {schema,products} from './generated-schema.mjs';
export {schema,products};
export function validateGift(raw){
  if(!raw||Array.isArray(raw)||raw.version!==1)throw new Error('INVALID_GIFT');
  const s=JSON.parse(JSON.stringify(schema.normalize(raw)));
  for(const k of ['animal','outfit','hat','glasses','background'])if(raw[k]!==s[k])throw new Error('INVALID_GIFT');
  for(const k of ['from','to','title','message'])if(!s[k].trim())throw new Error('INVALID_GIFT');
  for(const k of ['name','from','to','title','message','musicUrl','songTitle'])if(typeof raw[k]!=='string'||raw[k]!==s[k])throw new Error('INVALID_GIFT');
  for(const k of ['bodyColor','outfitColor','wrapColor','ribbonColor'])if(raw[k]!==s[k])throw new Error('INVALID_GIFT');
  if(!Array.isArray(raw.flowers)||raw.flowers.length!==s.flowers.length||raw.flowers.some((f,i)=>f.id!==s.flowers[i].id||f.color!==s.flowers[i].color))throw new Error('INVALID_GIFT');
  if(s.musicUrl){let u;try{u=new URL(s.musicUrl);}catch{throw new Error('INVALID_MUSIC');}if(u.protocol!=='https:'||u.username||u.password||u.port||!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','open.spotify.com'].includes(u.hostname)||!s.songTitle.trim())throw new Error('INVALID_MUSIC');}else if(s.songTitle.trim())throw new Error('INVALID_MUSIC');
  return s;
}
export function requiredProducts(s){return products.filter(p=>p.type==='flower'?s.flowers.some(f=>f.id===p.asset):p.type==='animal'?s.animal===p.asset:s.background===p.asset).map(p=>p.id);}
