// Test double only. Not imported from api/ or lib/.
import {randomUUID} from 'node:crypto';
import {fakeSupabase} from './fake-supabase.mjs';
export function fakePaymentStore(){
 const base=fakeSupabase(),paymentOrders=[],events=new Map();
 const response=(x,status=200)=>new Response(JSON.stringify(x),{status});
 const fetcher=async(input,options={})=>{
  const u=new URL(input),body=options.body?JSON.parse(options.body):{},path=u.pathname;
  if(path==='/rest/v1/rpc/doll_begin_checkout'){
   if(base.entitlements.some(x=>x.owner_id===body.p_owner&&x.product_id===body.p_product)||paymentOrders.some(o=>o.owner_id===body.p_owner&&o.product_id===body.p_product&&o.livemode===body.p_live&&o.status==='paid'))return response({error:'owned'});
   let order=paymentOrders.find(o=>o.owner_id===body.p_owner&&o.request_key===body.p_request&&o.livemode===body.p_live);
   if(order&&order.product_id!==body.p_product)return response({error:'conflict'});
   order ||=paymentOrders.find(o=>o.owner_id===body.p_owner&&o.product_id===body.p_product&&o.livemode===body.p_live&&o.status==='pending');
   if(!order){order={id:randomUUID(),owner_id:body.p_owner,product_id:body.p_product,amount_minor:body.p_product.startsWith('flower-')?1000:body.p_product.startsWith('animal-')?3000:['bg-glasshouse', 'bg-sunset-picnic', 'bg-cozy-room', 'bg-sakura-lantern', 'bg-starlight-rooftop'].includes(body.p_product)?4000:2000,currency:'thb',livemode:body.p_live,request_key:body.p_request,status:'pending',provider_session_id:null,provider_payment_id:null,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+3600000).toISOString(),paid_at:null,refunded_minor:0};paymentOrders.push(order);}
   return response({order});
  }
  if(path==='/rest/v1/rpc/doll_bind_checkout'){
   const order=paymentOrders.find(o=>o.id===body.p_order);if(!order||(order.provider_session_id&&order.provider_session_id!==body.p_session))return response({error:'conflict'});order.provider_session_id=body.p_session;return response({ok:true});
  }
  if(path==='/rest/v1/rpc/doll_apply_payment_event'){
   const o=paymentOrders.find(o=>o.id===body.p_order);
   if(!o||body.p_amount!==o.amount_minor||body.p_currency!==o.currency||body.p_live!==o.livemode||(o.provider_session_id&&o.provider_session_id!==body.p_session)||(o.provider_payment_id&&o.provider_payment_id!==body.p_payment))return response({error:'mismatch'});
   if(events.has(body.p_event))return response({ok:true,duplicate:true});events.set(body.p_event,{...body});
   let status=body.p_status;if(o.status==='refunded')status='refunded';else if(o.status==='paid'&&['pending','expired','failed'].includes(status))status='paid';
   Object.assign(o,{status,provider_session_id:body.p_session,provider_payment_id:o.provider_payment_id||body.p_payment,refunded_minor:Math.max(o.refunded_minor,body.p_refunded)});if(['paid','refunded'].includes(status))o.paid_at||=new Date().toISOString();return response({ok:true});
  }
  if(path==='/rest/v1/doll_payment_orders'){
   let rows=paymentOrders.filter(o=>['id','owner_id','status','livemode'].every(k=>!u.searchParams.has(k)||u.searchParams.get(k)==='eq.'+o[k]));
   const fields=u.searchParams.get('select');return response(rows.map(o=>fields==='*'?o:Object.fromEntries(fields.split(',').map(k=>[k,o[k]]))));
  }
  return base.fetcher(input,options);
 };
 return {...base,fetcher,paymentOrders,events};
}
export function fakeStripe(live=false){
 const sessions=new Map(),idempotency=new Map(),creates=[];let serial=0;
 const clone=x=>structuredClone(x);
 const client={checkout:{sessions:{
  async create(params,options){creates.push({params:clone(params),options:clone(options)});if(idempotency.has(options.idempotencyKey))return clone(sessions.get(idempotency.get(options.idempotencyKey)));
   const id='cs_'+(live?'live':'test')+'_'+(++serial),s={id,mode:'payment',metadata:params.metadata,client_reference_id:params.client_reference_id,livemode:live,currency:'thb',amount_total:params.line_items.reduce((sum,item)=>sum+item.price_data.unit_amount*item.quantity,0),payment_method_types:['promptpay'],expires_at:params.expires_at||Math.floor(Date.now()/1000)+86400,payment_status:'unpaid',payment_intent:null,status:'open',url:'https://checkout.stripe.com/c/pay/'+id};sessions.set(id,s);idempotency.set(options.idempotencyKey,id);return clone(s);
  },
  async retrieve(id){if(!sessions.has(id))throw new Error('missing session');return clone(sessions.get(id));},
  async list({payment_intent}){return {data:[...sessions.values()].filter(s=>s.payment_intent?.id===payment_intent).map(clone)};}
 }},paymentIntents:{async retrieve(id){const pi=[...sessions.values()].find(s=>s.payment_intent?.id===id)?.payment_intent;if(!pi)throw new Error('missing payment');return clone(pi);}}};
 function paid(id){const s=sessions.get(id);s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_'+id,status:'succeeded',amount_received:s.amount_total,currency:'thb',metadata:clone(s.metadata),latest_charge:{refunded:false,amount_refunded:0}};}
 function refunded(id,amount){const s=sessions.get(id);s.payment_intent.latest_charge={refunded:amount===s.amount_total,amount_refunded:amount};}
 return {client,sessions,creates,paid,refunded};
}
