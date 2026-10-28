import {guestWebhook} from './guest.mjs';
import Stripe from 'stripe';
import {AppError} from './supabase.mjs';
import {products} from './schema.mjs';
export const saleProducts=products.map(p=>({...p,amountMinor:p.amountMinor,currency:'thb',access:'account'}));
const validServerKey=(key,mode)=>typeof key==='string'&&new RegExp('^(?:sk|rk)_'+mode+'_[A-Za-z0-9_]+$').test(key);
export function paymentConfig(env){
 const mode=env.PAYMENTS_MODE==='live'?'live':'test';
 const credentials=validServerKey(env.STRIPE_SECRET_KEY,mode)&&!!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')&&/^pmc_[A-Za-z0-9]+$/.test(env.STRIPE_PAYMENT_METHOD_CONFIG||'');
 return {shopMode:['trial','paid'].includes(env.SHOP_MODE)?env.SHOP_MODE:'disabled',paymentMode:mode,checkoutEnabled:env.SHOP_MODE==='paid'&&credentials&&(mode==='test'||env.PAYMENTS_LIVE_ENABLED==='true'),currency:'thb'};
}
export function stripeClient(env){
 const mode=paymentConfig(env).paymentMode;
 if(!validServerKey(env.STRIPE_SECRET_KEY,mode)||!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))throw new AppError('PAYMENTS_NOT_READY',503);
 return new Stripe(env.STRIPE_SECRET_KEY,{timeout:5000,maxNetworkRetries:0,httpClient:Stripe.createFetchHttpClient()});
}
export async function verifyStripeEvent(env,raw,signature){
 if(!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))throw new AppError('PAYMENTS_NOT_READY',503);
 try{return await Stripe.webhooks.constructEventAsync(raw,signature,env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}catch{throw new AppError('INVALID_SIGNATURE',400);}
}
const reference=value=>typeof value==='string'?value:value?.id;
export async function ownedProducts(sb,env,userId){
 const legacy=await sb.rest('doll_entitlements','?select=product_id&owner_id=eq.'+encodeURIComponent(userId));
 // Live purchases survive a storefront pause. Test grants appear only in the test store.
 const sandbox=env.SHOP_MODE==='paid'&&paymentConfig(env).paymentMode==='test';
 const paid=await sb.rest('doll_payment_orders','?select=product_id&owner_id=eq.'+encodeURIComponent(userId)+'&status=eq.paid'+(sandbox?'':'&livemode=eq.true'));
 return [...new Set([...legacy,...paid].map(x=>x.product_id))];
}
export function orderDTO(order){return {id:order.id,productId:order.product_id,amountMinor:order.amount_minor,currency:order.currency,status:order.status,paymentMode:order.livemode?'live':'test',createdAt:order.created_at,expiresAt:order.expires_at,paidAt:order.paid_at,refundedMinor:order.refunded_minor||0};}
export async function reconcileSession(sb,env,stripe,sessionId,eventId){
 let session;try{session=await stripe.checkout.sessions.retrieve(sessionId,{expand:['payment_intent.latest_charge']});}catch{throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
 if(session.metadata?.app!=='doll-heart')return {ignored:true};
 const rows=await sb.rest('doll_payment_orders','?select=*&id=eq.'+encodeURIComponent(session.metadata.order_id)+'&limit=1');
 const order=rows?.[0];if(!order)throw new AppError('PAYMENT_MISMATCH',409);
 const pi=session.payment_intent,charge=typeof pi==='object'&&pi?pi.latest_charge:null;
 if(session.id!==sessionId||session.mode!=='payment'||session.client_reference_id!==order.id||session.metadata.product_id!==order.product_id||session.livemode!==order.livemode||session.livemode!==(paymentConfig(env).paymentMode==='live')||session.currency!==order.currency||session.amount_total!==order.amount_minor||!Array.isArray(session.payment_method_types)||session.payment_method_types.length!==1||session.payment_method_types[0]!=='promptpay'||(order.provider_session_id&&order.provider_session_id!==sessionId))throw new AppError('PAYMENT_MISMATCH',409);
 let status='pending',refunded=0;
 if(session.payment_status==='paid'){
  if(!pi||typeof pi!=='object'||pi.status!=='succeeded'||pi.amount_received!==order.amount_minor||pi.currency!==order.currency||pi.metadata?.app!=='doll-heart'||pi.metadata?.order_id!==order.id)throw new AppError('PAYMENT_MISMATCH',409);
  status='paid';
  if(charge&&typeof charge==='object'){
   refunded=Math.max(0,Math.min(order.amount_minor,Number(charge.amount_refunded)||0));
   if(charge.refunded===true&&refunded===order.amount_minor)status='refunded';
  }
 }else if(session.status==='expired')status='expired';
 else if(pi&&typeof pi==='object'&&(pi.status==='canceled'||(session.status==='complete'&&pi.status==='requires_payment_method')))status='failed';
 const id=eventId||`sync:${sessionId}:${status}:${refunded}`;
 const result=await sb.rpc('doll_apply_payment_event',{p_event:id,p_order:order.id,p_session:sessionId,p_payment:reference(pi)||null,p_amount:session.amount_total,p_currency:session.currency,p_live:session.livemode,p_status:status,p_refunded:refunded});
 if(!result?.ok)throw new AppError('PAYMENT_MISMATCH',409);
 return {orderId:order.id,status};
}
export async function handlePaymentWebhook(request,env,sb,factory=stripeClient){
 const declared=Number(request.headers.get('content-length'));if(declared>262144)throw new AppError('TOO_LARGE',413);
 const reader=request.body?.getReader(),chunks=[];let length=0;
 if(reader)for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>262144){await reader.cancel();throw new AppError('TOO_LARGE',413);}chunks.push(value);}
 const event=await verifyStripeEvent(env,Buffer.concat(chunks),request.headers.get('stripe-signature')||'');
 if(event.livemode!==(paymentConfig(env).paymentMode==='live'))throw new AppError('PAYMENT_MISMATCH',409);
 const object=event.data?.object;
 const sessionEvents=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'];
 if(!sessionEvents.includes(event.type)&&event.type!=='charge.refunded')return {received:true,ignored:true};
 const stripe=factory(env);const guest=await guestWebhook(event,env,sb,stripe);if(guest)return {received:true,...guest};let sessionId;
 if(sessionEvents.includes(event.type)){
  if(object?.metadata?.app!=='doll-heart')return {received:true,ignored:true};
  sessionId=object.id;
 }else{
  const paymentId=reference(object?.payment_intent);if(!paymentId)return {received:true,ignored:true};
  let pi;try{pi=await stripe.paymentIntents.retrieve(paymentId);}catch{throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
  if(pi.metadata?.app!=='doll-heart')return {received:true,ignored:true};
  const rows=await sb.rest('doll_payment_orders','?select=*&id=eq.'+encodeURIComponent(pi.metadata.order_id)+'&limit=1');
  sessionId=rows?.[0]?.provider_session_id;
  // A refund could arrive before the create-session response is attached locally.
  if(!sessionId){const list=await stripe.checkout.sessions.list({payment_intent:paymentId,limit:2});sessionId=list.data.find(s=>s.metadata?.order_id===pi.metadata.order_id)?.id;}
  if(!sessionId)throw new AppError('PAYMENT_MISMATCH',409);
 }
 if(typeof sessionId!=='string'||!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId))throw new AppError('INVALID_REQUEST');
 await reconcileSession(sb,env,stripe,sessionId,event.id);return {received:true};
}
export async function startCheckout(sb,env,stripe,user,productId,requestId,origin){
 if(!paymentConfig(env).checkoutEnabled)throw new AppError('PAYMENTS_NOT_READY',503);
 const product=saleProducts.find(p=>p.id===productId);if(!product)throw new AppError('INVALID_REQUEST');
 const result=await sb.rpc('doll_begin_checkout',{p_owner:user.id,p_product:product.id,p_request:requestId,p_live:paymentConfig(env).paymentMode==='live'});
 if(result?.error==='owned')throw new AppError('ALREADY_OWNED',409);
 if(result?.error==='quota')throw new AppError('RATE_LIMITED',429);
 if(!result?.order)throw new AppError('PAYMENT_MISMATCH',409);
 const order=result.order;
 if(order.owner_id!==user.id||order.product_id!==product.id||order.currency!=='thb')throw new AppError('PAYMENT_MISMATCH',409);
 if(order.status!=='pending')throw new AppError('CHECKOUT_FINISHED',409);
 if(order.amount_minor!==product.amountMinor)throw new AppError('PAYMENT_MISMATCH',409);
 let session;
 try{
  if(order.provider_session_id){
   session=await stripe.checkout.sessions.retrieve(order.provider_session_id);
   if(session.status!=='open'||session.payment_status==='paid'){
    await reconcileSession(sb,env,stripe,session.id);
    throw new AppError('CHECKOUT_FINISHED',409);
   }
  }else{
   const metadata={app:'doll-heart',order_id:order.id,product_id:product.id};
   session=await stripe.checkout.sessions.create({mode:'payment',payment_method_configuration:env.STRIPE_PAYMENT_METHOD_CONFIG,client_reference_id:order.id,metadata,payment_intent_data:{metadata},line_items:[{price_data:{currency:'thb',unit_amount:product.amountMinor,product_data:{name:product.name,description:'ซื้อครั้งเดียว ปลดล็อกถาวรในบัญชีของคุณ'}},quantity:1}],locale:'th',expires_at:Math.floor(new Date(order.expires_at).getTime()/1000),success_url:origin+'/manage?checkout='+order.id,cancel_url:origin+'/manage?checkout='+order.id+'&cancelled=1'},{idempotencyKey:'doll-heart:'+order.id});
  }
 }catch(e){if(e instanceof AppError)throw e;throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
 let checkout;try{checkout=new URL(session.url);}catch{throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
 if(checkout.origin!=='https://checkout.stripe.com'||checkout.username||checkout.password||session.livemode!==order.livemode||session.client_reference_id!==order.id||session.metadata?.order_id!==order.id||session.metadata?.app!=='doll-heart'||session.metadata?.product_id!==order.product_id||session.mode!=='payment'||session.currency!==order.currency||session.amount_total!==order.amount_minor||session.payment_method_types?.length!==1||session.payment_method_types[0]!=='promptpay')throw new AppError('PAYMENT_MISMATCH',409);
 const bound=await sb.rpc('doll_bind_checkout',{p_order:order.id,p_session:session.id});if(!bound?.ok)throw new AppError('PAYMENT_MISMATCH',409);
 return {orderId:order.id,checkoutUrl:checkout.href};
}
