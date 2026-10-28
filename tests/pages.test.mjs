import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import Stripe from 'stripe';
import {createPagesWorker} from '../cloudflare/worker.mjs';
import {schema,products,validateGift} from '../lib/schema.mjs';
import {verifyStripeEvent} from '../lib/payments.mjs';
import {testEnv} from './support/fake-supabase.mjs';

test('Pages adapter serves API with explicit bindings and delegates other requests to assets',async()=>{
 const paths=[],worker=createPagesWorker(env=>request=>{paths.push({env,path:new URL(request.url).pathname});return new Response('api');});
 const env={APP_ORIGIN:'https://gift.pages.dev',ASSETS:{fetch:request=>new Response(new URL(request.url).pathname)}};
 assert.equal(await (await worker.fetch(new Request(env.APP_ORIGIN+'/api/config'),env)).text(),'api');
 assert.equal(paths[0].env.APP_ORIGIN,env.APP_ORIGIN);
 assert.equal(paths[0].path,'/api/config');
 assert.equal(await (await worker.fetch(new Request(env.APP_ORIGIN+'/make'),env)).text(),'/make');
 assert.equal(paths.length,1);
});
test('Pages preview explicitly disables real checkout even with live settings attached',async()=>{
 let bound;const worker=createPagesWorker(env=>()=>{bound=env;return new Response('ok');});
 await worker.fetch(new Request('https://preview.gift.pages.dev/api/config'),{CF_PAGES:'1',CF_PAGES_BRANCH:'feature',SHOP_MODE:'paid',PAYMENTS_MODE:'live',PAYMENTS_LIVE_ENABLED:'true'});
 assert.equal(bound.SHOP_MODE,'disabled');assert.equal(bound.PAYMENTS_MODE,'test');assert.equal(bound.PAYMENTS_LIVE_ENABLED,'false');
 await worker.fetch(new Request('https://gift.pages.dev/api/config'),{CF_PAGES:'1',CF_PAGES_BRANCH:'main',SHOP_MODE:'paid',PAYMENTS_MODE:'live',PAYMENTS_LIVE_ENABLED:'true'});
 assert.equal(bound.PAYMENTS_MODE,'live');
});
test('hostname cutover recognizes only the two explicit production hosts',async()=>{
 const hosts=['https://doll-heart.pages.dev','https://specialdoll.pages.dev'];
 let bound;const worker=createPagesWorker(env=>()=>{bound=env;return new Response('ok');});
 for(const configured of hosts)for(const host of hosts){
  await worker.fetch(new Request(host+'/api/session/google'),{APP_ORIGIN:configured});
  assert.equal(bound.APP_ORIGIN,host);
 }
 for(const host of ['https://preview.specialdoll.pages.dev','https://specialdoll.pages.dev.evil.test']){
  await worker.fetch(new Request(host+'/api/me'),{APP_ORIGIN:hosts[1]});
  assert.equal(bound.APP_ORIGIN,hosts[1]);
 }
});
test('Pages rejects requests to a different configured origin and unconfigured deployment fails closed',async()=>{
 const worker=createPagesWorker();
 const noSetup=await (await worker.fetch(new Request('https://gift.pages.dev/api/config'),{})).json();
 assert.equal(noSetup.configured,false);assert.equal(noSetup.checkoutEnabled,false);
 const rejected=await worker.fetch(new Request('https://preview.gift.pages.dev/api/me'),{...testEnv,APP_ORIGIN:'https://gift.pages.dev'});
 assert.equal(rejected.status,403);
});
test('Build-time schema preserves browser normalization, all products, and custom drawings',()=>{
 const context={window:{},Intl};
 for(const file of ['art.js','wear-data.js','catalog.js','bouquet.js','gift-schema.js'])vm.runInNewContext(readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),context);
 const json=value=>JSON.parse(JSON.stringify(value));
 assert.deepEqual(json(products),json(context.window.LoveCatalog.products));
 for(const animal of context.window.PixelLove.animals){
  const gift={...schema.defaults(),animal:animal.id,from:'เรา',to:'เธอ',message:'รักนะ ก้ 👩‍❤️‍👩',flowers:[{id:'sakura',color:'#ed9faa'}],hat:'custom',customDesigns:{hat:context.window.CustomWear.template('hat')}};
  assert.deepEqual(json(validateGift(gift)),json(context.window.GiftSchema.normalize(gift)));
 }
});
test('Web Crypto webhook verification preserves exact UTF-8 bytes and rejects tampering',async()=>{
 const env={STRIPE_WEBHOOK_SECRET:'whsec_local_pages_only'};
 const payload=JSON.stringify({id:'evt_pages_test',type:'example.test',data:{object:{note:'รักนะ ♡'}}});
 const signature=Stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET});
 assert.equal((await verifyStripeEvent(env,new TextEncoder().encode(payload),signature)).id,'evt_pages_test');
 await assert.rejects(()=>verifyStripeEvent(env,new TextEncoder().encode(payload+' '),signature),{message:'INVALID_SIGNATURE'});
});
