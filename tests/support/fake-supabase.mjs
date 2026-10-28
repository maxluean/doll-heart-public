import {guestStore} from './fake-guests.mjs';
// Local test double only. Never imported by api/ or lib/ production code.
import {randomUUID} from 'node:crypto';
export function fakeSupabase(){
 const guest=guestStore();
 const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',gifts=[],entitlements=[],orders=[];let calls=[];
 const user={id:owner,email:'demo@example.test',app_metadata:{provider:'google',providers:['google']}};
 const response=(data,status=200)=>new Response(data===null?'':JSON.stringify(data),{status});
 async function fetcher(input,options={}){const url=new URL(input),body=options.body?JSON.parse(options.body):{},headers=new Headers(options.headers),path=url.pathname;calls.push({path,headers,body});
  const guestResponse=await guest.fetcher(url,options,body);if(guestResponse)return guestResponse;
  if(path==='/auth/v1/token'){if(url.searchParams.get('grant_type')==='pkce')return body.auth_code==='valid-code'&&body.code_verifier?.length===43?response({access_token:'owner-access',refresh_token:'valid-refresh',expires_in:3600,user}):response({},401);if(url.searchParams.get('grant_type')==='refresh_token')return body.refresh_token==='valid-refresh'?response({access_token:'owner-access',refresh_token:'valid-refresh',expires_in:3600,user}):response({},401);return body.email===user.email&&body.password==='demo-only'?response({access_token:'owner-access',refresh_token:'valid-refresh',expires_in:3600,user}):response({},400);}
  if(path==='/auth/v1/user'){const token=headers.get('authorization');return token==='Bearer owner-access'?response(user):token==='Bearer other-access'?response({id:other,email:'other@example.test',app_metadata:{provider:'google',providers:['google']}}):response({},401);}
  if(path==='/auth/v1/logout')return response(null,204);
  if(path==='/rest/v1/doll_payment_orders')return response([]);
  if(path==='/rest/v1/doll_entitlements')return response(entitlements.filter(x=>'eq.'+x.owner_id===url.searchParams.get('owner_id')));
  if(path==='/rest/v1/rpc/doll_trial_unlock'){if(!entitlements.some(x=>x.owner_id===body.p_owner&&x.product_id===body.p_product)){entitlements.push({owner_id:body.p_owner,product_id:body.p_product});orders.push({owner_id:body.p_owner,product_id:body.p_product,amount:0,mode:'trial'});}return response(null);}
  if(path==='/rest/v1/rpc/doll_create_gift'){const existing=gifts.find(g=>g.owner_id===body.p_owner&&g.request_key===body.p_request);if(existing)return response(existing.share_token_hash===body.p_hash&&JSON.stringify(existing.payload)===JSON.stringify(body.p_payload)&&!existing.revoked_at&&new Date(existing.expires_at)>new Date()?{id:existing.id,expires_at:existing.expires_at}:{error:'conflict'});if(gifts.filter(g=>g.owner_id===body.p_owner&&new Date(g.created_at)>new Date(Date.now()-86400000)).length>=20)return response({error:'quota'});const gift={id:randomUUID(),owner_id:body.p_owner,request_key:body.p_request,payload:body.p_payload,share_token_hash:body.p_hash,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+body.p_days*86400000).toISOString(),revoked_at:null};gifts.push(gift);return response({id:gift.id,expires_at:gift.expires_at});}
  if(path==='/rest/v1/doll_gifts'){let selected=gifts.filter(g=>['owner_id','id','share_token_hash'].every(k=>!url.searchParams.has(k)||url.searchParams.get(k)==='eq.'+g[k]));if(url.searchParams.has('revoked_at'))selected=selected.filter(g=>!g.revoked_at);if(url.searchParams.has('expires_at'))selected=selected.filter(g=>new Date(g.expires_at)>new Date(url.searchParams.get('expires_at').slice(3)));if(options.method==='PATCH'){for(const g of selected)Object.assign(g,body);return response(selected);}const fields=(url.searchParams.get('select')||'').split(',');return response(selected.map(g=>Object.fromEntries(fields.map(k=>[k,g[k]]))));}
  return response({error:'not in fake'},404);
 }
 return {fetcher,user,gifts,orders,entitlements,calls,owner,other,guestGifts:guest.gifts,guestEvents:guest.events};
}
export const testEnv={SUPABASE_URL:'https://project-test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_test',OWNER_EMAIL:'demo@example.test',APP_ORIGIN:'http://127.0.0.1:4174',SHOP_MODE:'trial'};
