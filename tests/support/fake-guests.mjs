// In-memory data service for guest API/payment integration tests and local preview only.
import {randomUUID} from 'node:crypto';
import {pricing} from '../../lib/generated-schema.mjs';
export function guestStore(){
 const gifts=[],events=new Set();
 const response=x=>new Response(JSON.stringify(x),{status:200});
 async function fetcher(url,options,body){const path=url.pathname;
  if(path==='/rest/v1/doll_guest_gifts'){
   let rows=gifts.filter(g=>['id','manage_hash','share_token_hash','livemode'].every(k=>!url.searchParams.has(k)||url.searchParams.get(k)==='eq.'+g[k]));
   if(url.searchParams.has('revoked_at'))rows=rows.filter(g=>!g.revoked_at);
   if(url.searchParams.has('expires_at'))rows=rows.filter(g=>new Date(g.expires_at)>new Date(url.searchParams.get('expires_at').slice(3)));
   if(url.searchParams.has('status'))rows=rows.filter(g=>['free','paid'].includes(g.status));
   if(url.searchParams.has('payload'))rows=rows.filter(g=>g.payload);
   if(options.method==='PATCH'){rows.forEach(g=>Object.assign(g,body));return response(rows);}
   const fields=url.searchParams.get('select')||'*';return response(rows.map(g=>fields==='*'?g:Object.fromEntries(fields.split(',').map(k=>[k,g[k]]))));
  }
  if(path==='/rest/v1/rpc/doll_guest_begin'){
   let g=gifts.find(g=>g.request_key===body.p_request);
   if(g)return response(g.manage_hash===body.p_manage&&g.share_token_hash===body.p_share&&JSON.stringify(g.payload)===JSON.stringify(body.p_payload)&&g.livemode===body.p_live&&(g.duration_hours===720)===body.p_month?{gift:g}:{error:'conflict'});
   if(gifts.filter(g=>g.device_hash===body.p_device&&new Date(g.created_at)>new Date(Date.now()-86400000)).length>=5||gifts.filter(g=>g.ip_hash===body.p_ip&&new Date(g.created_at)>new Date(Date.now()-86400000)).length>=50||gifts.filter(g=>new Date(g.created_at)>new Date(Date.now()-86400000)).length>=2000||gifts.filter(g=>g.payload).length>=50000)return response({error:'quota'});
   const q=pricing.quote(body.p_payload,body.p_month?'month':'hour');g={id:randomUUID(),request_key:body.p_request,manage_hash:body.p_manage,share_token_hash:body.p_share,device_hash:body.p_device,ip_hash:body.p_ip,payload:body.p_payload,amount_minor:q.amountMinor,items:q.items,duration_hours:q.hours,currency:'thb',livemode:body.p_live,status:q.amountMinor?'pending':'free',created_at:new Date().toISOString(),checkout_expires_at:new Date(Date.now()+86400000).toISOString(),expires_at:q.amountMinor?null:new Date(Date.now()+3600000).toISOString(),revoked_at:null,refunded_minor:0};gifts.push(g);return response({gift:g});
  }
  if(path==='/rest/v1/rpc/doll_guest_bind'){const g=gifts.find(g=>g.id===body.p_id);if(!g||g.provider_session_id&&g.provider_session_id!==body.p_session)return response({error:'conflict'});g.provider_session_id=body.p_session;return response({ok:true});}
  if(path==='/rest/v1/rpc/doll_guest_claim_sync'){const g=gifts.find(g=>g.id===body.p_id);if(!g||g.last_sync_at&&Date.now()-new Date(g.last_sync_at)<5000)return response({ok:false});g.last_sync_at=new Date().toISOString();return response({ok:true});}
  if(path==='/rest/v1/rpc/doll_guest_payment'){
   const g=gifts.find(g=>g.id===body.p_id);if(!g||!g.amount_minor||g.amount_minor!==body.p_amount||g.livemode!==body.p_live||g.provider_session_id&&g.provider_session_id!==body.p_session||g.provider_payment_id&&g.provider_payment_id!==body.p_payment)return response({error:'mismatch'});
   if(events.has(body.p_event))return response({ok:true,duplicate:true});events.add(body.p_event);
   let status=body.p_status;if(g.status==='refunded')status='refunded';else if(g.status==='paid'&&['pending','failed','expired'].includes(status))status='paid';
   Object.assign(g,{status,provider_session_id:body.p_session,provider_payment_id:g.provider_payment_id||body.p_payment,refunded_minor:Math.max(g.refunded_minor,body.p_refunded)});if(['paid','refunded'].includes(status)){g.paid_at||=new Date().toISOString();g.expires_at||=new Date(Date.now()+30*86400000).toISOString();}return response({ok:true});
  }
  return null;
 }
 return {gifts,events,fetcher};
}
