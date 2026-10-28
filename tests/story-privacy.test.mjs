import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/story.js',import.meta.url),'utf8');
const gift={from:'AliceUnique',to:'BobUnique',name:'BobUnique doll',title:'LetterSecret AliceUnique',message:'MessageSecret for BobUnique',songTitle:'AliceUnique song',musicUrl:'https://youtu.be/demo',background:'cream',flowers:[{id:'rose',color:'#ff8888'}]};
function renderer(){
  const drawn=[];
  const context=new Proxy({font:'',measureText(value){return {width:String(value).length*8};},fillText(value){drawn.push(String(value));},createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get:(target,key)=>key in target?target[key]:()=>{}});
  const document={fonts:{load:async()=>{},ready:Promise.resolve()},createElement:()=>({getContext:()=>context})};
  const window={PixelLove:{scene(){},draw(){},heart(){},bloom(){}},LoveCatalog:{specialLabels:()=>['Special doll','Special flower']},Bouquet:{describe:()=>({flower:{id:'rose',name:'Rose',meaning:'Love'},color:{hex:'#ff8888',label:'Pink',meaning:'Gratitude'}})}};
  vm.runInNewContext(source,{window,document,Intl});
  return {api:window.StoryCard,drawn};
}
for(let flags=0;flags<8;flags++)test(`story privacy combination ${flags} omits private text before drawing`,async()=>{
  const {api,drawn}=renderer(),original=structuredClone(gift);
  const privacy={hideLetter:!!(flags&1),hideFrom:!!(flags&2),hideTo:!!(flags&4)};
  const canvas=await api.render(gift,privacy),output=drawn.join('\n');
  assert.equal(canvas.width,1080);assert.equal(canvas.height,1920);
  assert.equal(output.includes('AliceUnique'),!privacy.hideFrom);
  assert.equal(output.includes('BobUnique'),!privacy.hideTo);
  assert.equal(output.includes('LetterSecret'),!privacy.hideLetter);
  assert.equal(output.includes('MessageSecret'),!privacy.hideLetter);
  assert.equal(output.includes('จดหมายนี้เป็นความลับ'),privacy.hideLetter);
  assert.ok(output.includes('Special doll'));assert.ok(output.includes('Special flower'));
  assert.deepEqual(gift,original,'export must not change the gift that recipients read');
});
test('hiding one name also removes repeated occurrences from all personalized fields',()=>{
  const {api}=renderer(),result=api.privacyView({...gift,from:'Ann',to:'Anna',message:'Ann and Anna'},{hideTo:true});
  assert.equal(result.from,'Ann');assert.equal(result.to,'คนพิเศษ');assert.equal(result.message,'Ann and •••');
  assert.equal(api.privacyView(gift).message,gift.message);
});
test('sender and recipient labels stay independent when names match or overlap',()=>{
  const {api}=renderer();
  for(const [from,to] of [['พลอย','พลอย'],['แม็ก','แม็กซ์'],['Ann','Anna'],['Anna','Ann']]){
    const sample={...gift,from,to,message:`${from} loves ${to}`};
    const senderHidden=api.privacyView(sample,{hideFrom:true});
    assert.equal(senderHidden.from,'ใครบางคน');assert.equal(senderHidden.to,to);
    const recipientHidden=api.privacyView(sample,{hideTo:true});
    assert.equal(recipientHidden.from,from);assert.equal(recipientHidden.to,'คนพิเศษ');
    const bothHidden=api.privacyView(sample,{hideFrom:true,hideTo:true});
    assert.equal(bothHidden.from,'ใครบางคน');assert.equal(bothHidden.to,'คนพิเศษ');
    assert.ok(!bothHidden.message.includes(from));assert.ok(!bothHidden.message.includes(to));
  }
});
