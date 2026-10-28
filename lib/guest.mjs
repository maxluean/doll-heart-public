import {createHash,createHmac,randomBytes} from 'node:crypto';
import {AppError} from './supabase.mjs';
import {validateGift} from './schema.mjs';
import {pricing} from './generated-schema.mjs';
import {paymentConfig} from './payments.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
export const guestShareToken=key=>createHash('sha256').update('specialdoll:recipient:'+key).digest('base64url').slice(0,32);
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const token=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
const rowFields='*';
function validated(raw){try{return validateGift(raw);}catch(e){throw new AppError(e.message==='INVALID_MUSIC'?'INVALID_MUSIC':'INVALID_GIFT',400);}}
export function guestDTO(g,origin,key){
 const active=['free','paid'].includes(g.status)&&!g.revoked_at&&g.payload&&new Date(g.expires_at)>new Date();
 const status=g.status==='pending'&&!g.provider_session_id&&new Date(g.checkout_expires_at)<=new Date()?'expired':g.status;
 return {id:g.id,status,amountMinor:g.amount_minor,items:g.items,currency:'thb',hours:g.duration_hours,paymentMode:g.livemode?'live':'test',createdAt:g.created_at,expiresAt:g.expires_at,checkoutExpiresAt:g.checkout_expires_at,revoked:!!g.revoked_at,active:!!active,refundedMinor:g.refunded_minor||0,gift:g.payload,recipientUrl:active?origin+'/g#'+guestShareToken(key):null};
}
async function findManaged(sb,key,id){
 if(!uuid(id)||!token(key))throw new AppError('NOT_FOUND',404);
 const rows=await sb.rest('doll_guest_gifts','?select='+rowFields+'&id=eq.'+id+'&manage_hash=eq.'+hash(key)+'&limit=1');
 if(!rows?.length)throw new AppError('NOT_FOUND',404);return rows[0];
}
function ensureSession(s,g,env){
 if(!s||s.mode!=='payment'||s.metadata?.app!=='specialdoll-gift'||s.metadata?.gift_id!==g.id||s.client_reference_id!==g.id||s.currency!=='thb'||s.amount_total!==g.amount_minor||s.livemode!==g.livemode||s.livemode!==(paymentConfig(env).paymentMode==='live')||s.payment_method_types?.length!==1||s.payment_method_types[0]!=='promptpay'||(g.provider_session_id&&s.id!==g.provider_session_id))throw new AppError('PAYMENT_MISMATCH',409);
}
export async function reconcileGuest(sb,env,stripe,sessionId,eventId){
 let session;try{session=await stripe.checkout.sessions.retrieve(sessionId,{expand:['payment_intent.latest_charge']});}catch{throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
 if(session.metadata?.app!=='specialdoll-gift')return {ignored:true};
 const id=session.metadata.gift_id;if(!uuid(id))throw new AppError('PAYMENT_MISMATCH',409);
 const rows=await sb.rest('doll_guest_gifts','?select=*&id=eq.'+id+'&limit=1'),g=rows?.[0];if(!g)throw new AppError('PAYMENT_MISMATCH',409);ensureSession(session,g,env);
 let status='pending',refunded=0;const pi=session.payment_intent;
 if(session.payment_status==='paid'){
  if(!pi||typeof pi!=='object'||pi.status!=='succeeded'||pi.amount_received!==g.amount_minor||pi.currency!=='thb'||pi.metadata?.app!=='specialdoll-gift'||pi.metadata?.gift_id!==g.id)throw new AppError('PAYMENT_MISMATCH',409);
  status='paid';const charge=pi.latest_charge;if(charge&&typeof charge==='object'){refunded=Math.max(0,Math.min(g.amount_minor,Number(charge.amount_refunded)||0));if(charge.refunded===true&&refunded===g.amount_minor)status='refunded';}
 }else if(session.status==='expired')status='expired';else if(pi&&typeof pi==='object'&&(pi.status==='canceled'||(session.status==='complete'&&pi.status==='requires_payment_method')))status='failed';
 const result=await sb.rpc('doll_guest_payment',{p_event:eventId||`guest-sync:${sessionId}:${status}:${refunded}`,p_id:g.id,p_session:sessionId,p_payment:typeof pi==='string'?pi:pi?.id||null,p_amount:g.amount_minor,p_live:g.livemode,p_status:status,p_refunded:refunded});
 if(!result?.ok)throw new AppError('PAYMENT_MISMATCH',409);return {giftId:g.id,status};
}
export async function guestWebhook(event,env,sb,stripe){
 const object=event.data?.object,sessionEvents=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'];
 if(sessionEvents.includes(event.type))return object?.metadata?.app==='specialdoll-gift'?reconcileGuest(sb,env,stripe,object.id,event.id):null;
 if(event.type==='charge.refunded'){
  const id=typeof object?.payment_intent==='string'?object.payment_intent:object?.payment_intent?.id;if(!id)return null;
  let pi;try{pi=await stripe.paymentIntents.retrieve(id);}catch{throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
  if(pi.metadata?.app!=='specialdoll-gift')return null;
  const rows=await sb.rest('doll_guest_gifts','?select=*&id=eq.'+encodeURIComponent(pi.metadata.gift_id)+'&limit=1');let sessionId=rows?.[0]?.provider_session_id;
  if(!sessionId){const list=await stripe.checkout.sessions.list({payment_intent:id,limit:2});sessionId=list.data.find(s=>s.metadata?.gift_id===pi.metadata.gift_id)?.id;}
  if(!sessionId)throw new AppError('PAYMENT_MISMATCH',409);return reconcileGuest(sb,env,stripe,sessionId,event.id);
 }return null;
}
async function checkout(g,key,origin,sb,env,stripe){
 if(g.status!=='pending'||!g.payload||new Date(g.checkout_expires_at)<=new Date())throw new AppError('CHECKOUT_FINISHED',409);
 let session;try{
  if(g.provider_session_id){session=await stripe.checkout.sessions.retrieve(g.provider_session_id);if(session.status!=='open'||session.payment_status==='paid'){await reconcileGuest(sb,env,stripe,session.id);return {gift:guestDTO(await findManaged(sb,key,g.id),origin,key)};}}
  else{const metadata={app:'specialdoll-gift',gift_id:g.id};session=await stripe.checkout.sessions.create({mode:'payment',payment_method_configuration:env.STRIPE_PAYMENT_METHOD_CONFIG,client_reference_id:g.id,metadata,payment_intent_data:{metadata},line_items:g.items.map(p=>({price_data:{currency:'thb',unit_amount:p.amountMinor,product_data:{name:p.name,description:'ใช้กับของขวัญนี้หนึ่งชิ้น · รวมลิงก์ 30 วัน'}},quantity:1})),locale:'th',success_url:origin+'/manage?gift='+g.id,cancel_url:origin+'/manage?gift='+g.id+'&cancelled=1'},{idempotencyKey:'specialdoll-gift:'+g.id});}
 }catch(e){if(e instanceof AppError)throw e;throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
 ensureSession(session,g,env);let target;try{target=new URL(session.url);}catch{throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);}
 if(target.origin!=='https://checkout.stripe.com'||target.username||target.password)throw new AppError('PAYMENT_PROVIDER_UNAVAILABLE',503);
 const result=await sb.rpc('doll_guest_bind',{p_id:g.id,p_session:session.id});if(!result?.ok)throw new AppError('PAYMENT_MISMATCH',409);
 if(Number.isFinite(session.expires_at))await sb.rest('doll_guest_gifts','?id=eq.'+g.id,{method:'PATCH',body:{checkout_expires_at:new Date(session.expires_at*1000).toISOString()}});
 return {gift:guestDTO(g,origin,key),checkoutUrl:target.href};
}
export async function handleGuest({path,body,sb,env,request,headers,origin,paymentFactory}){
 const mode=paymentConfig(env);
 if(path==='/api/guest/create'){
  if(!uuid(body.requestId)||!token(body.manageToken)||!['hour','month'].includes(body.plan))throw new AppError('INVALID_REQUEST');
  const gift=validated(body.gift),quote=pricing.quote(gift,body.plan);if(quote.amountMinor&&!mode.checkoutEnabled)throw new AppError('PAYMENTS_NOT_READY',503);
  const jar=Object.fromEntries((request.headers.get('cookie')||'').split(';').map(s=>s.trim().split('=')));
  let device=jar.dh_guest;if(!token(device)){device=randomBytes(32).toString('base64url');headers.append('Set-Cookie',`dh_guest=${device}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${request.url.startsWith('https:')?'; Secure':''}`);}
  const pepper=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY,identity=v=>createHmac('sha256',pepper).update(v).digest('hex');
  // Only our Pages adapter trusts the Cloudflare-provided connecting IP; clients
  // cannot set the adapter marker through a request header.
  const ip=env.TRUST_CF_CONNECTING_IP===true?request.headers.get('cf-connecting-ip'):null;
  const result=await sb.rpc('doll_guest_begin',{p_request:body.requestId,p_manage:hash(body.manageToken),p_share:hash(guestShareToken(body.manageToken)),p_device:identity('device:'+device),p_ip:identity('ip:'+(ip||device)),p_payload:gift,p_month:quote.hours===720,p_live:mode.paymentMode==='live'});
  if(result?.error==='quota')throw new AppError('GUEST_QUOTA',429);if(!result?.gift)throw new AppError('INVALID_REQUEST',409);
  const g=result.gift;if(g.amount_minor!==quote.amountMinor||g.duration_hours!==quote.hours||JSON.stringify(g.items)!==JSON.stringify(quote.items)){
   // JSONB object key order is not guaranteed: compare each line semantically.
   if(g.amount_minor!==quote.amountMinor||g.duration_hours!==quote.hours||g.items?.length!==quote.items.length||quote.items.some((p,i)=>Object.keys(p).some(k=>g.items[i]?.[k]!==p[k])))throw new AppError('PAYMENT_MISMATCH',409);
  }
  return {gift:guestDTO(g,origin,body.manageToken)};
 }
 const g=await findManaged(sb,body.manageToken,body.id);
 if(path==='/api/guest/checkout'){
  if(!mode.checkoutEnabled)throw new AppError('PAYMENTS_NOT_READY',503);return checkout(g,body.manageToken,origin,sb,env,paymentFactory(env));
 }
 if(path==='/api/guest/manage'){
  const action=body.action||'status';if(!['status','revoke','restore','edit'].includes(action))throw new AppError('INVALID_REQUEST');
  if(action!=='status'){
   if(!g.payload||!['free','paid'].includes(g.status)||new Date(g.expires_at)<=new Date())throw new AppError('NOT_FOUND',404);
   let patch;
   if(action==='edit'){
    const fields=['name','from','to','title','message','songTitle','musicUrl'];
    if(!body.edit||typeof body.edit!=='object'||Array.isArray(body.edit)||Object.keys(body.edit).some(k=>!fields.includes(k)))throw new AppError('INVALID_REQUEST');
    patch={payload:validated({...g.payload,...body.edit})};
   }else patch={revoked_at:action==='revoke'?new Date().toISOString():null};
   await sb.rest('doll_guest_gifts','?id=eq.'+g.id+'&manage_hash=eq.'+hash(body.manageToken)+'&status=in.(free,paid)&expires_at=gt.'+encodeURIComponent(new Date().toISOString()),{method:'PATCH',body:patch});
  }else if(g.provider_session_id&&g.status!=='refunded'&&g.livemode===(mode.paymentMode==='live')&&mode.checkoutEnabled){
   const claim=await sb.rpc('doll_guest_claim_sync',{p_id:g.id});if(claim?.ok)await reconcileGuest(sb,env,paymentFactory(env),g.provider_session_id);
  }
  return {gift:guestDTO(await findManaged(sb,body.manageToken,g.id),origin,body.manageToken)};
 }
 throw new AppError('NOT_FOUND',404);
}
