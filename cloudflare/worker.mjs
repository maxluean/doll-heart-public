import {createHandler} from '../lib/handler.mjs';
const productionOrigins=new Set(['https://doll-heart.pages.dev','https://specialdoll.pages.dev']);

// Pages advanced mode: only /api/* invokes this Worker; static files use Pages CDN.
export function createPagesWorker(apiFactory=createHandler){
 return {async fetch(request,env){
  if(new URL(request.url).pathname.startsWith('/api/')){
   // Preview deployments must never create real payment sessions, even if a live key
   // is accidentally attached. Production origin is explicitly set by the owner.
   const preview=env.CF_PAGES==='1'&&env.CF_PAGES_BRANCH!=='main';
   // Both owned production hosts remain valid during the hostname cutover. This
   // keeps old Stripe deliveries/OAuth callbacks working without trusting arbitrary
   // Host/Origin values or allowing preview hostnames to become production origins.
   const requestedOrigin=new URL(request.url).origin;
   let runtime=productionOrigins.has(env.APP_ORIGIN)&&productionOrigins.has(requestedOrigin)?{...env,APP_ORIGIN:requestedOrigin}:env;
   runtime={...runtime,TRUST_CF_CONNECTING_IP:true};
   if(preview)runtime={...runtime,SHOP_MODE:'disabled',PAYMENTS_MODE:'test',PAYMENTS_LIVE_ENABLED:'false'};
   return apiFactory(runtime)(request);
  }
  return env.ASSETS.fetch(request);
 }};
}
export default createPagesWorker();
