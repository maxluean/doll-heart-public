import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import Stripe from 'stripe';
import {createHandler} from '../lib/handler.mjs';
import {testEnv} from './support/fake-supabase.mjs';
import {fakePaymentStore,fakeStripe} from './support/fake-payments.mjs';
import {schema,pricing} from '../lib/generated-schema.mjs';
import {guestShareToken} from '../lib/guest.mjs';
import {readFileSync} from 'node:fs';
const secret='whsec_guest_local_test';
const env={...testEnv,APP_MODE:'public',GUEST_GIFTS_ENABLED:'true',SHOP_MODE:'paid',PAYMENTS_MODE:'test',STRIPE_SECRET_KEY:'sk_test_local_guest',STRIPE_WEBHOOK_SECRET:secret,STRIPE_PAYMENT_METHOD_CONFIG:'pmc_guestTest'};
function setup(overrides={}){
 const db=fakePaymentStore(),stripe=fakeStripe(),run=createHandler({...env,...overrides},db.fetcher,()=>stripe.client),device=randomBytes(32).toString('base64url');
 const request=(path,body,extra={})=>run(new Request(env.APP_ORIGIN+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin:env.APP_ORIGIN,cookie:'dh_guest='+device,...(body===undefined?{}:{'content-type':'application/json'}),...extra},body:body===undefined?undefined:JSON.stringify(body)}));
 const gift={...schema.defaults(),from:'ผู้ส่ง',to:'คนรับ'};
 const body=(changes={},plan='hour')=>({gift:{...gift,...changes},plan,requestId:randomUUID(),manageToken:randomBytes(32).toString('base64url')});
 async function create(b=body()){const r=await request('guest/create',b);assert.equal(r.status,200,await r.clone().text());return {b,g:(await r.json()).gift};}
 const webhook=async(type,sid,options={})=>{const s=stripe.sessions.get(sid),event={id:'evt_'+randomUUID(),livemode:false,type,data:{object:type==='charge.refunded'?{payment_intent:s.payment_intent.id}:structuredClone(s)}};const payload=JSON.stringify(event),signature=Stripe.webhooks.generateTestHeaderString({payload,secret,...options});return run(new Request(env.APP_ORIGIN+'/api/payments/webhook',{method:'POST',headers:{'content-type':'application/json','stripe-signature':signature},body:payload}));};
 return {...db,stripe,request,body,create,webhook};
}
const managed=({b,g})=>({id:g.id,manageToken:b.manageToken});
const share=key=>guestShareToken(key);
test('free guest gift needs no Auth and expires in one hour, never exposes management key to recipient',async()=>{
 const x=setup(),v=await x.create();assert.equal(v.g.amountMinor,0);assert.equal(v.g.status,'free');assert.ok(Math.abs(new Date(v.g.expiresAt)-new Date(v.g.createdAt)-3600000)<100);assert.equal(x.calls.filter(c=>c.path.startsWith('/auth/')).length,0);assert.equal((await x.request('session/google')).headers.get('location'),env.APP_ORIGIN+'/make');
 const r=await x.request('gifts/read',{token:share(v.b.manageToken)});assert.equal(r.status,200);const data=await r.json();assert.equal(data.gift.from,'ผู้ส่ง');assert.doesNotMatch(JSON.stringify(data),/manageToken|manage_hash|device_hash|ip_hash/);
 assert.equal((await x.request('guest/manage',{id:v.g.id,manageToken:share(v.b.manageToken)})).status,404);assert.equal((await x.request('guest/manage',{id:v.g.id,manageToken:randomBytes(32).toString('base64url')})).status,404);
 assert.ok(x.guestGifts[0].manage_hash!==v.b.manageToken);assert.equal(x.guestGifts[0].share_token_hash,createHash('sha256').update(share(v.b.manageToken)).digest('hex'));
});
test('one immutable gift is reused after network retries, changed data cannot reuse its request ID',async()=>{
 const x=setup(),v=await x.create();await x.create(v.b);assert.equal(x.guestGifts.length,1);const changed={...v.b,gift:{...v.b.gift,title:'changed'}};assert.equal((await x.request('guest/create',changed)).status,409);
});
test('server ignores client totals, bills selected assets once and includes month without extra 19THB',async()=>{
 const x=setup(),b={...x.body({animal:'panda',background:'glasshouse',flowers:[{id:'peony',color:'#df9db4'}]}),amountMinor:0,status:'paid',items:[]},v=await x.create(b);
 assert.equal(v.g.amountMinor,8000);assert.equal(v.g.hours,720);assert.equal(v.g.items.length,3);assert.equal(v.g.status,'pending');assert.equal(v.g.recipientUrl,null);assert.equal((await x.request('gifts/read',{token:share(b.manageToken)})).status,404);
 const r=await x.request('guest/checkout',managed(v));assert.equal(r.status,200);const params=x.stripe.creates[0].params;assert.equal(params.line_items.reduce((n,p)=>n+p.price_data.unit_amount,0),8000);assert.equal(params.line_items.length,3);assert.ok(params.line_items.every(p=>p.quantity===1));assert.equal(params.payment_method_configuration,env.STRIPE_PAYMENT_METHOD_CONFIG);
 assert.doesNotMatch(JSON.stringify(params),new RegExp(b.manageToken));assert.doesNotMatch(JSON.stringify(params),/ผู้ส่ง|คนรับ/);assert.match(params.success_url,/\/manage\?gift=/);
});
test('free assets with 30-day plan cost 19THB and no-login Checkout is idempotent',async()=>{
 const x=setup(),v=await x.create(x.body({},'month'));assert.equal(v.g.amountMinor,1900);await x.request('guest/checkout',managed(v));await x.request('guest/checkout',managed(v));assert.equal(x.stripe.creates.length,1);assert.equal(x.guestGifts.length,1);assert.equal(x.calls.filter(c=>c.path.startsWith('/auth/')).length,0);
});
test('signed verified payment activates thirty days once and cannot unlock the next gift',async()=>{
 const x=setup(),v=await x.create(x.body({animal:'panda'}));await x.request('guest/checkout',managed(v));const sid=x.guestGifts[0].provider_session_id;x.stripe.paid(sid);
 assert.equal((await x.webhook('checkout.session.completed',sid)).status,200);const expiry=x.guestGifts[0].expires_at;assert.equal(new Date(expiry)-new Date(x.guestGifts[0].paid_at),30*86400000);await x.webhook('checkout.session.completed',sid);assert.equal(x.guestGifts[0].expires_at,expiry);
 const status=await (await x.request('guest/manage',managed(v))).json();assert.equal(status.gift.active,true);assert.equal((await x.request('gifts/read',{token:share(v.b.manageToken)})).status,200);assert.equal(x.entitlements.length,0);assert.equal((await x.create(x.body({animal:'panda'}))).g.status,'pending');
});
test('failed/mismatched/unsigned events never grant access; refund revokes it and stale success cannot restore',async()=>{
 const x=setup(),v=await x.create(x.body({},'month'));await x.request('guest/checkout',managed(v));const sid=x.guestGifts[0].provider_session_id;
 assert.equal((await x.webhook('checkout.session.completed',sid,{secret:'whsec_wrong'})).status,400);x.stripe.paid(sid);x.stripe.sessions.get(sid).amount_total=1;assert.equal((await x.webhook('checkout.session.completed',sid)).status,409);assert.equal(x.guestGifts[0].status,'pending');
 x.stripe.sessions.get(sid).amount_total=1900;await x.webhook('checkout.session.completed',sid);x.stripe.refunded(sid,1900);assert.equal((await x.webhook('charge.refunded',sid)).status,200);assert.equal(x.guestGifts[0].status,'refunded');assert.equal((await x.request('gifts/read',{token:share(v.b.manageToken)})).status,404);
 x.stripe.refunded(sid,0);await x.webhook('checkout.session.completed',sid);assert.equal(x.guestGifts[0].status,'refunded');
});
test('manual sync confirms paid Checkout without trusting return URL or browser status',async()=>{
 const x=setup(),v=await x.create(x.body({},'month'));await x.request('guest/checkout',managed(v));const sid=x.guestGifts[0].provider_session_id;
 assert.equal((await (await x.request('guest/manage',{...managed(v),status:'paid'})).json()).gift.active,false);x.stripe.paid(sid);x.guestGifts[0].last_sync_at=null;
 assert.equal((await (await x.request('guest/manage',managed(v))).json()).gift.active,true);
});
test('only management capability can revoke/restore; expired links remain inaccessible',async()=>{
 const x=setup(),v=await x.create();await x.request('guest/manage',{...managed(v),action:'revoke'});assert.equal((await x.request('gifts/read',{token:share(v.b.manageToken)})).status,404);await x.request('guest/manage',{...managed(v),action:'restore'});assert.equal((await x.request('gifts/read',{token:share(v.b.manageToken)})).status,200);x.guestGifts[0].expires_at=new Date(Date.now()-1).toISOString();assert.equal((await x.request('gifts/read',{token:share(v.b.manageToken)})).status,404);assert.equal((await x.request('guest/manage',{...managed(v),action:'restore'})).status,404);
});
test('device rate limit, Origin check, mode controls and legacy purchase closure fail safely',async()=>{
 const x=setup();for(let i=0;i<5;i++)await x.create();assert.equal((await x.request('guest/create',x.body())).status,429);
 assert.equal((await x.request('guest/create',x.body(),{origin:'https://evil.test'})).status,403);
 assert.equal((await x.request('shop/checkout',{productId:'flower-peony',requestId:randomUUID()})).status,409);
 const disabled=setup({STRIPE_SECRET_KEY:''});assert.equal((await disabled.request('guest/create',disabled.body({},'month'))).status,503);assert.equal(disabled.guestGifts.length,0);assert.equal((await disabled.create()).g.status,'free');
});
test('pricing does not multiply by flowers, and asset selection is chargeable again on a new gift',()=>{
 const gift={...schema.defaults(),flowers:[{id:'peony'},{id:'peony'}]};const q=pricing.quote(gift,'month');assert.equal(q.amountMinor,1000);assert.equal(q.items.length,1);assert.equal(q.includedMonth,true);
});
test('guest migration keeps direct database access closed and enforces bounded retention and quotas',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/202610270009_guest_gifts.sql',import.meta.url),'utf8');assert.match(sql,/enable row level security/);assert.match(sql,/from public,anon,authenticated/);assert.match(sql,/>=5 or/);assert.match(sql,/>=2000 or/);assert.match(sql,/>=50000/);assert.match(sql,/payload=null/);assert.match(sql,/interval '7 days'/);assert.doesNotMatch(sql,/delete from public\.doll_gifts|drop table/);
});
test('management edits letter and music while preserving the purchased selection and expiry',async()=>{
 const x=setup(),v=await x.create(),expiry=x.guestGifts[0].expires_at;
 assert.equal((await x.request('guest/manage',{...managed(v),action:'edit',edit:{message:'เปลี่ยนข้อความได้',to:'คนเดิม',musicUrl:'https://youtu.be/abcdefghijk',songTitle:'เพลงของเรา'}})).status,200);
 assert.equal((await (await x.request('gifts/read',{token:share(v.b.manageToken)})).json()).gift.message,'เปลี่ยนข้อความได้');assert.equal(x.guestGifts[0].expires_at,expiry);
 assert.equal((await x.request('guest/manage',{...managed(v),action:'edit',edit:{animal:'panda'}})).status,400);assert.equal(x.guestGifts[0].payload.animal,'rabbit');
 assert.equal((await x.request('guest/manage',{...managed(v),action:'edit',edit:{message:''}})).status,400);
});
