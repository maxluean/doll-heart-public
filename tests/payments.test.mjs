import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import Stripe from 'stripe';
import {createHandler} from '../lib/handler.mjs';import {testEnv} from './support/fake-supabase.mjs';import {fakePaymentStore,fakeStripe} from './support/fake-payments.mjs';import {paymentConfig} from '../lib/payments.mjs';
const secret='whsec_local_signature_test_only';
const env={...testEnv,APP_MODE:'public',SHOP_MODE:'paid',PAYMENTS_MODE:'test',STRIPE_SECRET_KEY:'sk_test_local_not_real',STRIPE_WEBHOOK_SECRET:secret,STRIPE_PAYMENT_METHOD_CONFIG:'pmc_localTest'};
function setup(overrides={}){
 const db=fakePaymentStore(),stripe=fakeStripe(overrides.PAYMENTS_MODE==='live'),run=createHandler({...env,...overrides},db.fetcher,()=>stripe.client);
 const request=(path,{method='GET',body,cookie='dh_access=owner-access',origin=testEnv.APP_ORIGIN,headers={}}={})=>run(new Request(testEnv.APP_ORIGIN+'/api/'+path,{method,headers:{origin,cookie,...(body!==undefined?{'content-type':'application/json'}:{}),...headers},body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)}));
 const buy=(productId='flower-peony',extra={})=>request('shop/checkout',{method:'POST',body:{productId,requestId:randomUUID(),...extra}});
 const webhook=async(type,sessionId,changes={},signatureOptions={})=>{
  const object=type==='charge.refunded'?{payment_intent:stripe.sessions.get(sessionId)?.payment_intent?.id}:structuredClone(stripe.sessions.get(sessionId));
  const event={id:'evt_'+randomUUID(),livemode:overrides.PAYMENTS_MODE==='live',type,data:{object},...changes};const payload=JSON.stringify(event);
  const signature=Stripe.webhooks.generateTestHeaderString({payload,secret,...signatureOptions});
  return request('payments/webhook',{method:'POST',body:payload,cookie:'',origin:'https://external.stripe.test',headers:{'stripe-signature':signature}});
 };
 return {...db,stripe,request,buy,webhook};
}
async function start(x,product='flower-peony',extra={}){const r=await x.buy(product,extra);assert.equal(r.status,201);const body=await r.json();return {body,id:x.paymentOrders[0].provider_session_id,order:x.paymentOrders[0]};}
test('live checkout requires matching live key, webhook secret and explicit live activation',()=>{
 assert.equal(paymentConfig({...env,PAYMENTS_MODE:'live'}).checkoutEnabled,false);
 assert.equal(paymentConfig({...env,PAYMENTS_MODE:'live',STRIPE_SECRET_KEY:'sk_live_local'}).checkoutEnabled,false);
 assert.equal(paymentConfig({...env,PAYMENTS_MODE:'live',STRIPE_SECRET_KEY:'sk_live_local',PAYMENTS_LIVE_ENABLED:'true'}).checkoutEnabled,true);
 assert.equal(paymentConfig({...env,SHOP_MODE:'disabled'}).checkoutEnabled,false);
 assert.equal(paymentConfig({...env,STRIPE_PAYMENT_METHOD_CONFIG:''}).checkoutEnabled,false);
});
test('checkout fails closed before creating an order without provider credentials',async()=>{const x=setup({STRIPE_SECRET_KEY:''});assert.equal((await x.buy()).status,503);assert.equal(x.paymentOrders.length,0);assert.equal(x.stripe.creates.length,0);});
test('checkout requires login and same origin, and public trial grants cannot bypass payment',async()=>{const x=setup();for(const options of [{cookie:''},{origin:'https://evil.test'}])assert.ok([401,403].includes((await x.request('shop/checkout',{method:'POST',body:{productId:'flower-peony',requestId:randomUUID()},...options})).status));assert.equal((await x.request('shop/unlock',{method:'POST',body:{productId:'flower-peony'}})).status,409);assert.equal(x.stripe.creates.length,0);});
test('server fixes flower=10THB, scene=20THB, quantity1, permanent access and PromptPay only',async()=>{
 const x=setup();await start(x,'flower-peony',{amount:1,currency:'usd',status:'paid',ownerId:x.other,quantity:99});
 const p=x.stripe.creates[0].params;assert.equal(p.line_items[0].price_data.unit_amount,1000);assert.equal(p.line_items[0].price_data.currency,'thb');assert.equal(p.line_items[0].quantity,1);assert.equal(p.payment_method_types,undefined);assert.equal(p.payment_method_configuration,env.STRIPE_PAYMENT_METHOD_CONFIG);assert.equal(x.paymentOrders[0].owner_id,x.owner);assert.equal(p.mode,'payment');assert.ok(!JSON.stringify(p).includes('demo@example.test'));assert.match(p.success_url,/\/manage\?checkout=/);assert.match(p.cancel_url,/cancelled=1/);
 const scene=setup();await start(scene,'bg-starry');assert.equal(scene.stripe.creates[0].params.line_items[0].price_data.unit_amount,2000);
});
test('retries and separate tabs reuse the pending order and the same Stripe idempotency key',async()=>{const x=setup(),a=await start(x);await x.buy();await x.buy();assert.equal(x.paymentOrders.length,1);assert.equal(x.stripe.creates.length,1);assert.equal(x.stripe.sessions.size,1);assert.equal(a.order.status,'pending');});
test('owned trial products cannot be charged again',async()=>{const x=setup();x.entitlements.push({owner_id:x.owner,product_id:'flower-peony'});assert.equal((await x.buy()).status,409);assert.equal(x.stripe.creates.length,0);});
test('return URL and forged paid fields grant nothing while provider is unpaid',async()=>{const x=setup(),a=await start(x);const r=await x.request('shop/orders/'+a.order.id+'/sync',{method:'POST',body:{paid:true,status:'paid'}});assert.equal((await r.json()).order.status,'pending');assert.deepEqual((await (await x.request('me')).json()).owned,[]);});
test('invalid/tampered/stale webhook signatures never update orders',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);assert.equal((await x.webhook('checkout.session.completed',a.id,{}, {secret:'whsec_wrong'})).status,400);assert.equal((await x.webhook('checkout.session.completed',a.id,{}, {timestamp:1})).status,400);assert.equal(a.order.status,'pending');assert.equal(x.events.size,0);});
test('authenticated sync verifies provider status and grants purchase once without relying on redirect',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);const r=await x.request('shop/orders/'+a.order.id+'/sync',{method:'POST',body:{}});assert.equal((await r.json()).order.status,'paid');assert.deepEqual((await (await x.request('me')).json()).owned,['flower-peony']);assert.equal((await x.buy()).status,409);});
test('signed webhook can arrive before session binding and grants only a verified paid order',async()=>{const x=setup(),a=await start(x);a.order.provider_session_id=null;x.stripe.paid(a.id);assert.equal((await x.webhook('checkout.session.completed',a.id)).status,200);assert.equal(a.order.provider_session_id,a.id);assert.equal(a.order.status,'paid');});
test('duplicate event delivery is idempotent and expired event does not remove paid access',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);const eventId='evt_fixed_replay';assert.equal((await x.webhook('checkout.session.completed',a.id,{id:eventId})).status,200);assert.equal((await x.webhook('checkout.session.completed',a.id,{id:eventId})).status,200);assert.equal(x.events.size,1);await x.webhook('checkout.session.expired',a.id);assert.equal(a.order.status,'paid');});
test('provider amount/currency/mode/reference mismatches and unsupported methods never grant',async()=>{
 for(const mutation of [{amount_total:1},{currency:'usd'},{livemode:true},{client_reference_id:randomUUID()},{payment_method_types:['card']},{metadata:{app:'doll-heart',order_id:'bad',product_id:'flower-peony'}}]){
  const x=setup(),a=await start(x);x.stripe.paid(a.id);Object.assign(x.stripe.sessions.get(a.id),mutation);assert.ok([409,503].includes((await x.webhook('checkout.session.completed',a.id)).status));assert.equal(a.order.status,'pending');
 }
});
test('another Google user cannot list, sync or claim the sender order',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);assert.equal((await x.request('shop/orders/'+a.order.id+'/sync',{method:'POST',body:{},cookie:'dh_access=other-access'})).status,404);assert.deepEqual((await (await x.request('shop/orders',{cookie:'dh_access=other-access'})).json()).orders,[]);assert.equal(a.order.status,'pending');});
test('sandbox grants do not unlock live ownership',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);await x.webhook('checkout.session.completed',a.id);const live=createHandler({...env,PAYMENTS_MODE:'live',STRIPE_SECRET_KEY:'sk_live_local',PAYMENTS_LIVE_ENABLED:'true'},x.fetcher,()=>x.stripe.client);const r=await live(new Request(testEnv.APP_ORIGIN+'/api/me',{headers:{cookie:'dh_access=owner-access'}}));assert.deepEqual((await r.json()).owned,[]);assert.equal(x.entitlements.length,0);});
test('full refund revokes that purchase, duplicate delayed paid event cannot restore it',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);await x.webhook('checkout.session.completed',a.id);x.stripe.refunded(a.id,1000);assert.equal((await x.webhook('charge.refunded',a.id)).status,200);assert.equal(a.order.status,'refunded');await x.webhook('checkout.session.completed',a.id);assert.deepEqual((await (await x.request('me')).json()).owned,[]);});
test('partial refund keeps access, and full refund does not remove independent free trial ownership',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);await x.webhook('checkout.session.completed',a.id);x.stripe.refunded(a.id,300);await x.webhook('charge.refunded',a.id);assert.equal(a.order.status,'paid');assert.equal(a.order.refunded_minor,300);x.entitlements.push({owner_id:x.owner,product_id:'flower-peony'});x.stripe.refunded(a.id,1000);await x.webhook('charge.refunded',a.id);assert.deepEqual((await (await x.request('me')).json()).owned,['flower-peony']);});
test('webhook can reconcile already-paid orders while storefront is paused',async()=>{const x=setup(),a=await start(x);x.stripe.paid(a.id);const run=createHandler({...env,SHOP_MODE:'disabled'},x.fetcher,()=>x.stripe.client);const event={id:'evt_paused',livemode:false,type:'checkout.session.completed',data:{object:x.stripe.sessions.get(a.id)}};const raw=JSON.stringify(event);const r=await run(new Request(testEnv.APP_ORIGIN+'/api/payments/webhook',{method:'POST',headers:{'stripe-signature':Stripe.webhooks.generateTestHeaderString({payload:raw,secret})},body:raw}));assert.equal(r.status,200);assert.equal(a.order.status,'paid');});
test('provider outage remains pending and never grants access',async()=>{const x=setup();x.stripe.client.checkout.sessions.create=async()=>{throw new Error('timeout');};assert.equal((await x.buy()).status,503);assert.equal(x.paymentOrders.length,1);assert.equal(x.paymentOrders[0].status,'pending');assert.equal(x.entitlements.length,0);});
test('invalid checkout target is rejected rather than redirecting buyer',async()=>{const x=setup();const original=x.stripe.client.checkout.sessions.create;x.stripe.client.checkout.sessions.create=async(...args)=>({...await original(...args),url:'https://checkout.stripe.com.evil.test/pay'});assert.equal((await x.buy()).status,409);});


test('pausing checkout preserves already purchased live access',async()=>{const x=setup({PAYMENTS_MODE:'live',STRIPE_SECRET_KEY:'sk_live_local',PAYMENTS_LIVE_ENABLED:'true'}),a=await start(x);x.stripe.paid(a.id);await x.webhook('checkout.session.completed',a.id);const run=createHandler({...env,SHOP_MODE:'disabled',PAYMENTS_MODE:'test'},x.fetcher,()=>x.stripe.client);const r=await run(new Request(testEnv.APP_ORIGIN+'/api/me',{headers:{cookie:'dh_access=owner-access'}}));assert.deepEqual((await r.json()).owned,['flower-peony']);});


test('asynchronous failure releases the pending order for a fresh checkout',async()=>{const x=setup(),a=await start(x);const s=x.stripe.sessions.get(a.id);s.status='complete';s.payment_intent={id:'pi_failed',status:'requires_payment_method',metadata:s.metadata};assert.equal((await x.webhook('checkout.session.async_payment_failed',a.id)).status,200);assert.equal(a.order.status,'failed');assert.equal((await x.buy()).status,201);assert.equal(x.paymentOrders.length,2);});
test('resuming checkout also validates amount and method before redirecting',async()=>{const x=setup(),a=await start(x);x.stripe.sessions.get(a.id).amount_total=9000;assert.equal((await x.buy()).status,409);assert.equal(a.order.status,'pending');});
test('reusing a terminal request never creates a new provider session',async()=>{const x=setup(),requestId=randomUUID();await x.buy('flower-peony',{requestId});const o=x.paymentOrders[0];o.status='failed';o.provider_session_id=null;const before=x.stripe.creates.length;const r=await x.buy('flower-peony',{requestId});assert.equal(r.status,409);assert.equal((await r.json()).error,'CHECKOUT_FINISHED');assert.equal(x.stripe.creates.length,before);assert.equal((await x.buy()).status,201);});
test('configuration drift exposing another method is rejected before returning checkout URL',async()=>{const x=setup(),create=x.stripe.client.checkout.sessions.create;x.stripe.client.checkout.sessions.create=async(...args)=>({...await create(...args),payment_method_types:['promptpay','card']});const r=await x.buy();assert.equal(r.status,409);assert.equal((await r.json()).checkoutUrl,undefined);assert.deepEqual((await (await x.request('me')).json()).owned,[]);});

test('new collection contains 20 paid flower species and three paid animal companions',async()=>{
 const x=setup(),config=await (await x.request('config',{cookie:''})).json();const fresh=config.products.filter(p=>p.collection==='bloom-20'),animals=config.products.filter(p=>p.type==='animal');
 assert.equal(fresh.length,20);assert.equal(animals.length,3);assert.equal(new Set(config.products.map(p=>p.id)).size,32);
 for(const p of [...fresh,...animals]){assert.equal(p.trialAllowed,false);assert.equal(p.amountMinor,p.type==='flower'?1000:3000);}
});
test('every new paid product uses fixed server prices and permanent verified ownership',async()=>{
 const config=await (await setup().request('config',{cookie:''})).json();for(const p of config.products.filter(p=>p.trialAllowed===false)){
 const x=setup(),r=await x.buy(p.id,{amount:1,quantity:100,ownerId:x.other});assert.equal(r.status,201,p.id);const o=x.paymentOrders[0],sid=o.provider_session_id;assert.equal(o.amount_minor,p.amountMinor,p.id);x.stripe.paid(sid);assert.equal((await x.webhook('checkout.session.completed',sid)).status,200,p.id);assert.ok((await (await x.request('me')).json()).owned.includes(p.id),p.id);
 }
});
test('premium animal and flower payloads require both purchases before creating a gift',async()=>{
 const x=setup();const base=(await import('../lib/schema.mjs')).schema.defaults();const gift={...JSON.parse(JSON.stringify(base)),animal:'panda',from:'เรา',to:'เธอ',flowers:[{id:'sakura',color:'#ed9faa'}]};
 const body={gift,expiresInDays:7,requestId:randomUUID(),shareToken:'A'.repeat(32)};
 assert.equal((await x.request('gifts',{method:'POST',body})).status,403);
 for(const p of ['animal-panda','flower-sakura']){const r=await x.buy(p);assert.equal(r.status,201);const o=x.paymentOrders.at(-1);x.stripe.paid(o.provider_session_id);await x.webhook('checkout.session.completed',o.provider_session_id);}
 assert.equal((await x.request('gifts',{method:'POST',body})).status,201);
 const other=await x.request('gifts',{method:'POST',cookie:'dh_access=other-access',body:{...body,requestId:randomUUID(),shareToken:'B'.repeat(32)}});assert.equal(other.status,403);
});
test('new collection cannot bypass paid ownership through the old free trial endpoint',async()=>{const x=setup({SHOP_MODE:'trial'});for(const productId of ['animal-panda','flower-sakura']){const r=await x.request('shop/unlock',{method:'POST',body:{productId}});assert.equal(r.status,409);assert.equal(x.entitlements.length,0);}});

test('new scene needs settled ownership, then recipients read it without buying or logging in',async()=>{
 const {schema,products}=await import('../lib/schema.mjs');
 for(const p of products.filter(p=>p.collection==='scenes-5')){
  const x=setup(),gift={...JSON.parse(JSON.stringify(schema.defaults())),from:'เรา',to:'เธอ',background:p.asset};
  const body={gift,expiresInDays:7,requestId:randomUUID(),shareToken:'S'.repeat(32)};
  assert.equal((await x.request('gifts',{method:'POST',body})).status,403);
  const {id,order}=await start(x,p.id,{amount:1});assert.equal(order.amount_minor,4000);
  assert.equal((await x.request('gifts',{method:'POST',body})).status,403);
  x.stripe.paid(id);assert.equal((await x.webhook('checkout.session.completed',id)).status,200);
  assert.equal((await x.request('gifts',{method:'POST',body})).status,201);
  const read=await x.request('gifts/read',{method:'POST',cookie:'',body:{token:body.shareToken}});assert.equal(read.status,200);assert.equal((await read.json()).gift.background,p.asset);
  const other=await x.request('gifts',{method:'POST',cookie:'dh_access=other-access',body:{...body,requestId:randomUUID(),shareToken:'T'.repeat(32)}});assert.equal(other.status,403);
  const trial=setup({SHOP_MODE:'trial'});assert.equal((await trial.request('shop/unlock',{method:'POST',body:{productId:p.id}})).status,409);
 }
});


test('historical animal order reconciles its original amount after the catalog price changes',async()=>{
 const x=setup(),a=await start(x,'animal-panda');assert.equal(a.order.amount_minor,3000);
 a.order.amount_minor=2000;const s=x.stripe.sessions.get(a.id);s.amount_total=2000;x.stripe.paid(a.id);
 assert.equal((await x.webhook('checkout.session.completed',a.id)).status,200);assert.equal(a.order.amount_minor,2000);
 assert.ok((await (await x.request('me')).json()).owned.includes('animal-panda'));
});
test('expired historical-price request returns a finished checkout without creating another provider session',async()=>{
 const x=setup(),requestId=randomUUID();await x.buy('animal-monkey',{requestId});const o=x.paymentOrders[0];o.amount_minor=2000;o.status='expired';
 const before=x.stripe.creates.length,r=await x.buy('animal-monkey',{requestId});assert.equal((await r.json()).error,'CHECKOUT_FINISHED');assert.equal(x.stripe.creates.length,before);
});


test('restricted server keys work in the matching mode and public or cross-mode keys fail closed',async()=>{
 for(const key of ['rk_live_local','sk_live_local'])assert.equal(paymentConfig({...env,PAYMENTS_MODE:'live',STRIPE_SECRET_KEY:key,PAYMENTS_LIVE_ENABLED:'true'}).checkoutEnabled,true);
 for(const key of ['rk_test_local','pk_live_local','sk_org_local','sk_live_','rk_live_bad space'])assert.equal(paymentConfig({...env,PAYMENTS_MODE:'live',STRIPE_SECRET_KEY:key,PAYMENTS_LIVE_ENABLED:'true'}).checkoutEnabled,false);
 const x=setup({STRIPE_SECRET_KEY:'rk_test_local'});await start(x,'animal-red-panda');assert.equal(x.stripe.creates[0].params.line_items[0].price_data.unit_amount,3000);
});
