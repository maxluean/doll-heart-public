import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {schema,pricing} from '../lib/generated-schema.mjs';
const source=readFileSync(new URL('../dist/story-access.js',import.meta.url),'utf8');
const basic={...schema.defaults(),from:'Sender',to:'Recipient'};
const special={...basic,animal:'monkey',flowers:[{id:'lotus',color:'#dfa3b6'}]};
const token='a'.repeat(32),origin='https://gift.test';
function setup(gift=special){const window={};vm.runInNewContext(source,{window,URL});let state={plan:'hour',receipt:null,recipientToken:null,origin},current=gift,reads=0,denied=false;const gate=window.StoryAccess.create({quote:pricing.quote,normalize:schema.normalize,context:()=>state,readGift:async key=>{reads++;assert.equal(key,token);if(denied)throw new Error('expired');return {gift:current};}});return {gate,state,get reads(){return reads;},set denied(v){denied=v;},set gift(v){current=v;}};}
const receipt=gift=>({status:'paid',active:true,fingerprint:JSON.stringify(schema.normalize(gift)),expiresAt:new Date(Date.now()+86400000).toISOString(),recipientUrl:origin+'/g#'+token});
test('basic free story export stays available without receipts or server calls',async()=>{const x=setup(basic);assert.equal(x.gate.allowed(basic),true);await x.gate.assert(basic);assert.equal(x.reads,0);assert.equal(x.gate.allowed(null),false);});
test('any unpaid selection, including the all-basic 19THB plan, cannot prepare a story image',async()=>{
 for(const gift of [special,{...basic,flowers:[{id:'peony',color:'#df9db4'}]},{...basic,background:'glasshouse'}]){const x=setup(gift);assert.equal(x.gate.allowed(gift),false);await assert.rejects(x.gate.assert(gift),/ชำระยอด/);assert.equal(x.reads,0);}
 const x=setup(basic);x.state.plan='month';assert.equal(x.gate.allowed(basic),false);await assert.rejects(x.gate.assert(basic),/ชำระยอด/);
});
test('pending, withdrawn, expired or changed receipts do not unlock images',async()=>{
 for(const change of [{status:'pending'},{active:false},{expiresAt:new Date(0).toISOString()},{fingerprint:'different-gift'}]){const x=setup();x.state.receipt={...receipt(special),...change};assert.equal(x.gate.allowed(special),false);await assert.rejects(x.gate.assert(special),/ชำระยอด/);}
});
test('a paid image is revalidated against the server before each preview or download',async()=>{
 const x=setup();x.state.receipt=receipt(special);assert.equal(x.gate.allowed(special),true);await x.gate.assert(special);await x.gate.assert(special);assert.equal(x.reads,2);x.denied=true;await assert.rejects(x.gate.assert(special),/ยืนยันสิทธิ์/);
});
test('valid receiver links can export after verification, raw embedded gift links cannot bypass payment',async()=>{
 const x=setup();x.state.recipientToken=token;await x.gate.assert(special);assert.equal(x.reads,1);x.state.recipientToken=null;await assert.rejects(x.gate.assert(special),/ชำระยอด/);x.state.recipientToken=token;x.gift={...special,message:'Different gift'};await assert.rejects(x.gate.assert(special),/ยืนยันสิทธิ์/);
});
test('receipt URLs must use the same site and recipient route',async()=>{for(const recipientUrl of ['https://evil.test/g#'+token,origin+'/manage#'+token]){const x=setup();x.state.receipt={...receipt(special),recipientUrl};await assert.rejects(x.gate.assert(special),/ชำระยอด/);assert.equal(x.reads,0);}});
test('app never invokes the full-resolution story renderer for an unpaid gift',async()=>{
 const nodes=new Map(),element=()=>({innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){}});
 const document={documentElement:element(),querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);},querySelectorAll:()=>[],addEventListener(){}};
 let renders=0;const window={LoveRoute:{isRecipient:()=>true},LoveCloud:{},addEventListener(){},StoryCard:{render:async()=>{renders++;return {width:1080,height:1920};}}};
 const ctx={window,document,Intl,URL,AbortController,TextDecoder,TextEncoder,atob,setTimeout,clearTimeout,location:{pathname:'/make',origin,hash:''}};
 for(const file of ['art.js','wear-data.js','catalog.js','bouquet.js','gift-schema.js','gift-pricing.js','story-access.js','app.js'])vm.runInNewContext(readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
 await assert.rejects(window.DollHeart.storyCanvas(special),/ชำระยอด/);assert.equal(renders,0);await window.DollHeart.storyCanvas(basic);assert.equal(renders,1);
});
