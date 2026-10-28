import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const ctx={window:{}};
for(const file of ['art.js','catalog.js','bouquet.js'])vm.runInNewContext(readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
const B=ctx.window.Bouquet,P=ctx.window.PixelLove;
const requirements={sunflower:'yellow orange red',hydrangea:'pink blue purple white green',lily:'white pink yellow orange red',forget:'blue pink white',peony:'pink red white cream yellow',lavender:'purple blue white',carnation:'pink red white yellow purple orange',gerbera:'pink red orange yellow white',orchid:'pink white purple yellow orange',lotus:'pink white blue purple yellow',sakura:'pink white red',chrysanthemum:'yellow white red pink purple',cosmos:'pink white red yellow orange',poppy:'red orange white pink yellow',iris:'purple blue yellow white pink',magnolia:'white pink purple yellow',gardenia:'white cream pink',jasmine:'white cream yellow',camellia:'red pink white yellow','orange-blossom':'white orange cream',bluebell:'blue purple white pink',delphinium:'blue purple pink white',statice:'purple blue pink white cream yellow',lilac:'purple white pink blue',daffodil:'yellow white cream orange',anemone:'white red purple pink blue'};
test('all 26 specified flowers offer only their owner-specified colors',()=>{
 assert.equal(Object.keys(B.species).length,26);
 for(const [id,colors] of Object.entries(requirements)){
  assert.ok(P.flowers.some(f=>f.id===id),id);
  assert.deepEqual(Array.from(B.paletteFor(id),t=>t.id),colors.split(' '),id);
  for(const tone of B.paletteFor(id))assert.ok(tone.meaning&&tone.name&&/^#[a-f0-9]{6}$/.test(tone.swatch));
 }
 assert.equal(B.tones.length,9);assert.ok(!B.tones.some(t=>['black','brown','gray'].includes(t.id)));
});
test('color meaning depends on the flower, including less romantic meanings and grouped colors',()=>{
 const meaning=(id,color)=>B.describe({id,color:B.tones.find(t=>t.id===color).swatch});
 assert.equal(meaning('sunflower','red').flower.meaning,'ความศรัทธา ความจงรักภักดี พลังบวก');
 assert.equal(meaning('sunflower','red').color.meaning,'ความรักที่เข้มแข็ง ความมุ่งมั่น');
 assert.equal(meaning('carnation','pink').color.meaning,'ความรักและความกตัญญูของลูกต่อแม่');
 assert.equal(meaning('gerbera','pink').color.meaning,'ความชื่นชม ความอ่อนหวาน');
 assert.equal(meaning('carnation','yellow').color.meaning,'ความผิดหวัง (บางที่ตีความว่าความเป็นมิตร)');
 assert.equal(meaning('carnation','purple').color.meaning,'ความเอาแต่ใจ ความไม่แน่นอน');
 assert.equal(meaning('chrysanthemum','white').color.meaning,'ความซื่อสัตย์ ความจริงใจ (ในบางวัฒนธรรมใช้ไว้อาลัย)');
 assert.match(meaning('sakura','red').color.label,/แดง \/ ชมพูเข้ม/);
 for(const [id,a,b] of [['cosmos','yellow','orange'],['orange-blossom','orange','cream'],['statice','white','cream']])assert.equal(meaning(id,a).color.meaning,meaning(id,b).color.meaning);
});
test('unspecified flowers use the nine general color meanings; shop copy stays in sync',async()=>{
 for(const id of ['tulip','rose','daisy']){
  assert.equal(B.paletteFor(id).length,9);
  assert.equal(B.describe({id,color:'#d990a6'}).color.meaning,'ความรักอ่อนโยน ความห่วงใย ความประทับใจ');
 }
 const {products}=await import('../lib/schema.mjs');
 for(const product of products.filter(p=>p.type==='flower'))assert.equal(product.note,P.flowers.find(f=>f.id===product.asset).meaning);
});
test('editing old drafts selects a permitted color without changing sent gift artwork',()=>{
 const input=[{id:'sunflower',color:'#94b8d6'},{id:'lavender',color:'#abcdef'},{id:'gardenia',color:'#000000'}],before=JSON.stringify(input);
 const edited=B.forEditor(input);
 for(const f of edited)assert.ok(B.paletteFor(f.id).some(t=>t.swatch===f.color));
 assert.equal(JSON.stringify(input),before);
 assert.equal(B.describe(input[0]).color.hex,'#94b8d6');
 for(const f of P.flowers)assert.ok(B.paletteFor(f.id).some(t=>t.swatch===f.color),f.id);
});
