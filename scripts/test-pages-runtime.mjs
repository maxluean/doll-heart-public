import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import Stripe from 'stripe';
import assert from 'node:assert/strict';

// Fixed dummy credentials. Never read .env, .dev.vars, or production bindings.
const secret='whsec_local_pages_runtime_only';
const runtime=new Miniflare(convertV4MiniflareOptions({
 modules:true,scriptPath:'.pages/_worker.js',compatibilityDate:'2026-10-24',compatibilityFlags:['nodejs_compat'],
 bindings:{APP_ORIGIN:'https://gift.pages.test',APP_MODE:'public',GUEST_GIFTS_ENABLED:'true',SUPABASE_URL:'https://project-test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',STRIPE_WEBHOOK_SECRET:secret,PAYMENTS_MODE:'test',SHOP_MODE:'disabled'}
}));
try{
 const config=await (await runtime.dispatchFetch('https://gift.pages.test/api/config')).json();
 assert.equal(config.configured,true);assert.equal(config.guestMode,true);assert.ok(config.products.every(p=>p.access==='gift'));assert.equal(config.checkoutEnabled,false);
 const payload=JSON.stringify({id:'evt_runtime_only',type:'example.unsupported',livemode:false,data:{object:{note:'รักนะ ♡'}}});
 const signature=Stripe.webhooks.generateTestHeaderString({payload,secret});
 for(const [body,expected] of [[payload,200],[payload+' ',400]]){
  const response=await runtime.dispatchFetch('https://gift.pages.test/api/payments/webhook',{method:'POST',headers:{'stripe-signature':signature},body});
  assert.equal(response.status,expected,await response.text());
 }
 console.log('PASS actual workerd: schema startup, safe config, UTF-8 WebCrypto signature, tampered payload rejection');
}finally{await runtime.dispose();}
