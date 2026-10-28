import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function recipient(){
 const nodes=new Map();
 const element=()=>({innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},focus(){},setAttribute(){}});
 const document={documentElement:element(),querySelector(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},querySelectorAll(){return [];},addEventListener(){}};
 const window={LoveRoute:{isRecipient:()=>true},LoveCloud:{},addEventListener(){},scrollTo(){}};
 const ctx={window,document,Intl,URL,AbortController,TextDecoder,TextEncoder,atob,setTimeout,clearTimeout,location:{pathname:'/make',origin:'https://gift.test',hash:''}};
 for(const file of ['art.js','wear-data.js','catalog.js','gift-schema.js','bouquet.js','gift-pricing.js','story-access.js'])vm.runInNewContext(readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
 const gift={...window.GiftSchema.defaults(),animal:'panda',from:'คนส่ง',to:'คนรับ',title:'ถึงเธอ <3',message:'จดหมายต้องอ่านก่อนเปิดกล่อง',flowers:[{id:'sakura',color:'#ed9faa'}]};
 ctx.location.hash='#gift='+Buffer.from(JSON.stringify(gift)).toString('base64url');
 window.PixelLove.draw=()=>{};
 vm.runInNewContext(readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),ctx);
 return {html:()=>nodes.get('#recipient').innerHTML,click:selector=>nodes.get(selector).handlers.click({currentTarget:nodes.get(selector)}),catalog:window.LoveCatalog,defaults:window.GiftSchema.defaults};
}
test('recipient reads the complete letter between envelope opening and gift box, then can replay',async()=>{
 const r=recipient();
 assert.match(r.html(),/envelope-theatre/);assert.doesNotMatch(r.html(),/จดหมายต้องอ่านก่อนเปิดกล่อง|box-theatre|received-doll/);
 await r.click('#open-gift');
 assert.match(r.html(),/recipient-letter/);assert.match(r.html(),/จดหมายต้องอ่านก่อนเปิดกล่อง/);assert.match(r.html(),/ถึงเธอ &lt;3/);
 assert.doesNotMatch(r.html(),/box-theatre|received-doll/);
 await r.click('#continue-to-box');
 assert.match(r.html(),/box-theatre/);assert.doesNotMatch(r.html(),/received-doll/);
 await r.click('#open-gift');
 assert.match(r.html(),/received-doll/);assert.match(r.html(),/Special doll/);assert.match(r.html(),/Special flower/);
 await r.click('#replay-gift');assert.match(r.html(),/envelope-theatre/);assert.doesNotMatch(r.html(),/received-doll/);
});
test('special collection labels follow selected assets, independent of account or ownership',()=>{
 const r=recipient(),base=r.defaults();
 assert.deepEqual(Array.from(r.catalog.specialLabels(base)),[]);
 assert.deepEqual(Array.from(r.catalog.specialLabels({...base,animal:'panda'})),['Special doll']);
 assert.deepEqual(Array.from(r.catalog.specialLabels({...base,flowers:[{id:'peony'},{id:'sakura'}]})),['Special flower']);
 assert.deepEqual(Array.from(r.catalog.specialLabels({...base,animal:'monkey',flowers:[{id:'sakura'}]})),['Special doll','Special flower']);
});
