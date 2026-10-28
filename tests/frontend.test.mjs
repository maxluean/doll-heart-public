import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const cloud=readFileSync(new URL('../dist/cloud.js',import.meta.url),'utf8');
function client({recipient=false,create=false,shop={}}={}){
 const calls=[],dialogs=[];
 const window={LoveRoute:{isRecipient:()=>recipient,isCreate:()=>create},dispatchEvent(){}};
 const document={addEventListener(){},body:{append(){}},createElement(){const el={innerHTML:'',setAttribute(){},addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},showModal(){this.open=true;}};dialogs.push(el);return el;}};
 const fetch=async(path,options)=>{calls.push({path,options});return new Response(JSON.stringify(path==='/api/config'?{configured:true,authMode:'google',shopMode:'trial',...shop}:path==='/api/me'?{user:{email:'sender@example.test'},owned:[],shopMode:'trial',...shop}:{gift:{to:'Recipient'}}));};
 vm.runInNewContext(cloud,{window,document,fetch,Event,location:{pathname:recipient?'/g':'/',search:create?'?create=1':''},URLSearchParams,clearTimeout,setTimeout,Intl,localStorage:{getItem:()=>null,setItem(){}},CustomEvent:class{},URL});
 return {calls,dialogs,api:window.LoveCloud};
}
test('recipient links load no sender configuration or session and read gifts without credentials',async()=>{
 const x=client({recipient:true});await x.api.ready;assert.equal(x.calls.length,0);assert.equal(x.api.user,null);
 await x.api.api('gifts/read',{method:'POST',body:{token:'a'.repeat(32)}});
 assert.equal(x.calls.length,1);assert.equal(x.calls[0].path,'/api/gifts/read');assert.equal(x.calls[0].options.credentials,'omit');assert.equal(x.dialogs.length,0);
});
test('new gift entry starts without a login dialog or Auth calls',async()=>{const x=client({create:true});await x.api.ready;assert.deepEqual(x.calls.map(c=>c.path),['/api/config']);assert.equal(x.api.user,null);assert.equal(x.dialogs.length,0);});



test('guest storefront previews prices without charging or requiring provider readiness',async()=>{
 const x=client({shop:{shopMode:'paid',paymentMode:'test',checkoutEnabled:false,products:[{id:'flower-peony',asset:'peony',type:'flower',icon:'✿',name:'โบตั๋น',note:'รัก',amountMinor:1000},{id:'bg-cafe',asset:'cafe',type:'background',icon:'☕',name:'คาเฟ่',note:'เดต',amountMinor:2000}]}});
 await x.api.ready;await x.api.open('shop');const html=x.dialogs[0].innerHTML;
 assert.match(html,/฿10/);await x.api.open('shop',null,'background');assert.match(x.dialogs[0].innerHTML,/฿20/);assert.match(html,/จ่ายครั้งเดียวตอนส่ง/);assert.match(html,/data-select-product="flower-peony"/);assert.doesNotMatch(html,/data-cloud-pay/);assert.doesNotMatch(html,/data-cloud-unlock/);
});
test('storefront never creates standalone permanent purchases',async()=>{
 const x=client({shop:{shopMode:'paid',paymentMode:'test',checkoutEnabled:true,products:[{id:'bg-cafe',asset:'cafe',type:'background',icon:'☕',name:'คาเฟ่',note:'เดต',amountMinor:2000}]}});await x.api.ready;await x.api.open('shop');assert.match(x.dialogs[0].innerHTML,/รวมลิงก์ 30 วัน/);assert.match(x.dialogs[0].innerHTML,/฿20/);assert.doesNotMatch(x.dialogs[0].innerHTML,/data-cloud-pay|ปลดล็อกถาวร/);
});

test('scene store exposes real canvas artwork and full preview without requiring checkout readiness',async()=>{
 const {products}=await import('../lib/schema.mjs');const scenes=products.filter(p=>p.type==='background');
 const x=client({shop:{shopMode:'paid',paymentMode:'live',checkoutEnabled:false,products:scenes}});await x.api.ready;await x.api.open('shop',null,'background');
 const html=x.dialogs[0].innerHTML;assert.match(html,/shop-grid-scenes/);assert.equal((html.match(/data-shop-scene=/g)||[]).length,7);assert.match(html,/฿40/);
 for(const p of scenes){assert.ok(html.includes(`data-shop-scene="${p.asset}"`));assert.ok(html.includes(`data-preview-scene="${p.id}"`));assert.ok(!html.includes(`data-preview-scene="${p.id}" disabled`));}
});

test('public Home is distinct from the maker and forwards legacy entries to fixed local routes',()=>{
 const script=readFileSync(new URL('../dist/home-route.js',import.meta.url),'utf8');
 const entry=(search='',hash='')=>{let redirect=null;vm.runInNewContext(script,{location:{pathname:'/',search,hash,replace:value=>{redirect=value;}},URLSearchParams});return redirect;};
 assert.equal(entry(),null);assert.equal(entry('?create=1&next=https://evil.test'),'/make?create=1');assert.equal(entry('','#gift=old-token'),'/make#gift=old-token');
});
test('maker and recipient routes remain isolated without requiring Google',()=>{
 const script=readFileSync(new URL('../dist/route.js',import.meta.url),'utf8');const window={},document={documentElement:{dataset:{}}};
 vm.runInNewContext(script,{window,document,location:{pathname:'/make',search:'?create=1',hash:''},URLSearchParams});assert.equal(window.LoveRoute.isCreate(),true);assert.equal(window.LoveRoute.isRecipient(),false);
 vm.runInNewContext(script,{window,document,location:{pathname:'/g',search:'',hash:'#token'},URLSearchParams});assert.equal(window.LoveRoute.isRecipient(),true);assert.equal(document.documentElement.dataset.view,'recipient');
});
