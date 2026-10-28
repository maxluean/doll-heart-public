import {handleGuest} from './guest.mjs';
import {randomBytes,createHash} from 'node:crypto';
import {configured,supabase,AppError} from './supabase.mjs';
import {validateGift,requiredProducts} from './schema.mjs';
import {saleProducts,paymentConfig,stripeClient,handlePaymentWebhook,ownedProducts,orderDTO,startCheckout,reconcileSession} from './payments.mjs';
const hash=token=>createHash('sha256').update(token).digest('hex');
const googleUser=user=>user?.app_metadata?.provider==='google'||user?.app_metadata?.providers?.includes('google');
const allowedUser=(user,env)=>env.APP_MODE==='public'?googleUser(user):user?.email?.toLowerCase()===env.OWNER_EMAIL?.trim().toLowerCase();
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const tokenOK=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{32}$/.test(v);
const messages={GUEST_QUOTA:'ทำรายการถึงขีดจำกัดแล้ว อุปกรณ์หนึ่งสร้างได้ 5 ชิ้นใน 24 ชั่วโมง หรือระบบอาจเต็มชั่วคราว กรุณาลองภายหลัง',LEGACY_STORE_CLOSED:'ร้านเปลี่ยนเป็นชำระต่อของขวัญ กรุณาสรุปยอดจากหน้าสร้างของขวัญ',PAYMENTS_NOT_READY:'ร้านกำลังเตรียมรับพร้อมเพย์ ยังไม่มีการหักเงิน',PAYMENT_PROVIDER_UNAVAILABLE:'เชื่อมต่อพร้อมเพย์ไม่ได้ รายการเดิมยังอยู่ในประวัติ ลองตรวจสถานะก่อนจ่ายใหม่นะ',PAYMENT_MISMATCH:'ข้อมูลคำสั่งซื้อไม่ตรงกัน กรุณาติดต่อผู้ดูแล',INVALID_SIGNATURE:'ยืนยันรายการไม่ได้',ALREADY_OWNED:'คุณมีสินค้านี้แล้ว ไม่ต้องซื้อซ้ำ',CHECKOUT_FINISHED:'รายการนี้สิ้นสุดแล้ว ตรวจประวัติคำสั่งซื้อก่อนเริ่มรายการใหม่นะ',SETUP_REQUIRED:'กำลังเชื่อมระบบหลังบ้าน ยังสร้างลิงก์ถาวรไม่ได้',AUTH_REQUIRED:'เข้าสู่ระบบผู้ส่งก่อนนะ',AUTH_FAILED:'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือเซสชันหมดอายุ',FORBIDDEN:'กรุณาเข้าสู่ระบบด้วยบัญชี Google',INVALID_GIFT:'ข้อมูลของขวัญไม่ครบหรือไม่ถูกต้อง',INVALID_MUSIC:'ตรวจลิงก์และชื่อเพลงอีกครั้งนะ',NOT_FOUND:'ไม่พบของขวัญ ลิงก์อาจหมดอายุหรือถูกถอนแล้ว',LOCKED_PRODUCT:'ปลดล็อกดอกไม้หรือฉากนี้ในร้านก่อนนะ',SERVICE_UNAVAILABLE:'เชื่อมต่อระบบไม่ได้ ลองใหม่อีกครั้งนะ',DATABASE_UNAVAILABLE:'ฐานข้อมูลยังไม่พร้อม กรุณาตรวจการติดตั้ง Supabase',RATE_LIMITED:'ทำรายการถึงขีดจำกัด กรุณาลองใหม่ภายหลัง',INVALID_REQUEST:'คำขอไม่ถูกต้อง',SHOP_DISABLED:'ร้านอยู่ระหว่างเตรียมพร้อม ยังไม่มีการเรียกเก็บเงิน',TOO_LARGE:'ข้อมูลมีขนาดใหญ่เกินไป'};
function cookies(request){return Object.fromEntries((request.headers.get('cookie')||'').split(';').map(s=>s.trim().split(/=(.*)/s).slice(0,2)).filter(a=>a.length===2));}
function sessionCookies(headers,data,secure){for(const [key,value,age] of [['dh_access',data?.access_token||'',data?Math.max(60,Number(data.expires_in)||3600):0],['dh_refresh',data?.refresh_token||'',data?60*60*24*30:0]])headers.append('Set-Cookie',`${key}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`);}
export function createHandler(inputEnv,fetcher=fetch,paymentFactory=stripeClient){
 const env={...inputEnv,APP_ORIGIN:inputEnv.APP_ORIGIN||(inputEnv.VERCEL_PROJECT_PRODUCTION_URL?'https://'+inputEnv.VERCEL_PROJECT_PRODUCTION_URL:undefined)};
 return async function handle(request){
  const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'});
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  const url=new URL(request.url),path=(url.searchParams.has('_route')?'/api/'+url.searchParams.get('_route'):url.pathname).replace(/\/$/,''),method=request.method,secure=url.protocol==='https:';
  try{
   if(path==='/api/config'&&method==='GET')return json({configured:configured(env),...paymentConfig(env),products:env.GUEST_GIFTS_ENABLED==='true'?saleProducts.map(p=>({...p,access:'gift'})):saleProducts,authMode:env.GUEST_GIFTS_ENABLED==='true'?'guest':env.APP_MODE==='public'?'google':'private',guestMode:env.GUEST_GIFTS_ENABLED==='true',version:8});
   if(!configured(env))throw new AppError('SETUP_REQUIRED',503);
   const expected=new URL(env.APP_ORIGIN).origin;
   if(url.origin!==expected)throw new AppError('INVALID_REQUEST',403);
   if(path!=='/api/payments/webhook'&&!['GET','HEAD'].includes(method)&&request.headers.get('origin')!==expected)throw new AppError('INVALID_REQUEST',403);
   const sb=supabase(env,fetcher);
   if(path==='/api/payments/webhook'&&method==='POST')return json(await handlePaymentWebhook(request,env,sb,paymentFactory));
   let body={};if(!['GET','HEAD'].includes(method)){
    if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new AppError('INVALID_REQUEST',415);
    if(Number(request.headers.get('content-length'))>32768)throw new AppError('TOO_LARGE',413);
    const reader=request.body?.getReader();let size=0,chunks=[];if(reader)for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();throw new AppError('TOO_LARGE',413);}chunks.push(value);}
    try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new AppError('INVALID_REQUEST');}
    if(!body||Array.isArray(body)||typeof body!=='object')throw new AppError('INVALID_REQUEST');
   }
   if(env.GUEST_GIFTS_ENABLED==='true'&&path.startsWith('/api/session/google')&&method==='GET'){headers.set('Location',expected+'/make');return new Response(null,{status:302,headers});}
   if(path.startsWith('/api/guest/')&&method==='POST'&&env.GUEST_GIFTS_ENABLED==='true')return json(await handleGuest({path,body,sb,env,request,headers,origin:expected,paymentFactory}));
   if(env.GUEST_GIFTS_ENABLED==='true'&&method==='POST'&&['/api/shop/checkout','/api/shop/unlock','/api/gifts'].includes(path))throw new AppError('LEGACY_STORE_CLOSED',409);
   if(path==='/api/session/google'&&method==='GET'){
    const verifier=randomBytes(32).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
    headers.append('Set-Cookie',`dh_pkce=${verifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure?'; Secure':''}`);
    const authorize=new URL(env.SUPABASE_URL+'/auth/v1/authorize');authorize.searchParams.set('provider','google');authorize.searchParams.set('redirect_to',expected+'/api/session/google/callback');authorize.searchParams.set('code_challenge',challenge);authorize.searchParams.set('code_challenge_method','s256');authorize.searchParams.set('scopes','openid email profile');authorize.searchParams.set('prompt','select_account');
    headers.set('Location',authorize.href);return new Response(null,{status:302,headers});
   }
   if(path==='/api/session/google/callback'&&method==='GET'){
    const code=url.searchParams.get('code'),verifier=cookies(request).dh_pkce;
    headers.append('Set-Cookie',`dh_pkce=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`);
    let error='';
    if(!code||code.length>2048||!verifier||!/^[A-Za-z0-9_-]{43}$/.test(verifier))error='google_cancelled';
    else try{const session=await sb.exchange(code,verifier);const verified=await sb.user(session.access_token);if(!allowedUser(verified,env)){await sb.logout(session.access_token);error='forbidden';}else sessionCookies(headers,session,secure);}catch{error='google_failed';}
    headers.set('Location',expected+'/manage'+(error?'?auth_error='+error:''));return new Response(null,{status:302,headers});
   }
   if(path==='/api/gifts/read'&&method==='POST'){
    if(!tokenOK(body.token))throw new AppError('NOT_FOUND',404);
    const rows=await sb.rest('doll_gifts','?select=payload&share_token_hash=eq.'+hash(body.token)+'&revoked_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&limit=1');
    if(rows?.length)return json({gift:rows[0].payload});
    if(env.GUEST_GIFTS_ENABLED!=='true')throw new AppError('NOT_FOUND',404);
    const guest=await sb.rest('doll_guest_gifts','?select=payload,status&share_token_hash=eq.'+hash(body.token)+'&revoked_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&status=in.(free,paid)&payload=not.is.null&livemode=eq.'+(paymentConfig(env).paymentMode==='live')+'&limit=1');
    if(!guest?.length)throw new AppError('NOT_FOUND',404);return json({gift:guest[0].payload});
   }
   if(path==='/api/session/login'&&method==='POST'){
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    if(env.APP_MODE==='public'||email!==env.OWNER_EMAIL?.trim().toLowerCase()||typeof body.password!=='string'||body.password.length>512)throw new AppError('AUTH_FAILED',401);
    const session=await sb.login(email,body.password);if(!session.user?.id||session.user.email?.toLowerCase()!==email)throw new AppError('AUTH_FAILED',401);
    sessionCookies(headers,session,secure);return json({user:{email:session.user.email,id:session.user.id}});
   }
   const jar=cookies(request);let access=decodeURIComponent(jar.dh_access||''),user;
   if(access)try{user=await sb.user(access);}catch(e){if(e.status!==401)throw e;}
   if(!user&&jar.dh_refresh){let session;try{session=await sb.refresh(decodeURIComponent(jar.dh_refresh));}catch(e){if(e.status!==401)throw e;sessionCookies(headers,null,secure);throw new AppError('AUTH_REQUIRED',401);}access=session.access_token;user=await sb.user(access);sessionCookies(headers,session,secure);}
   if(!user?.id)throw new AppError('AUTH_REQUIRED',401);
   if(!allowedUser(user,env))throw new AppError('FORBIDDEN',403);
   if(path==='/api/session/logout'&&method==='POST'){await sb.logout(access);sessionCookies(headers,null,secure);return json({ok:true});}
   if(path==='/api/me'&&method==='GET'){
    const owned=await ownedProducts(sb,env,user.id);return json({user:{email:user.email,id:user.id},owned,products:saleProducts,...paymentConfig(env)});
   }
   if(path==='/api/shop/unlock'&&method==='POST'){
    if(env.SHOP_MODE!=='trial')throw new AppError('SHOP_DISABLED',409);
    const product=saleProducts.find(p=>p.id===body.productId);if(!product)throw new AppError('INVALID_REQUEST');if(product.trialAllowed===false)throw new AppError('SHOP_DISABLED',409);
    await sb.rpc('doll_trial_unlock',{p_owner:user.id,p_product:body.productId});return json({unlocked:body.productId,mode:'trial',charged:0});
   }
   if(path==='/api/shop/checkout'&&method==='POST'){
    if(!uuid(body.requestId)||typeof body.productId!=='string')throw new AppError('INVALID_REQUEST');
    if(!paymentConfig(env).checkoutEnabled)throw new AppError('PAYMENTS_NOT_READY',503);
    return json(await startCheckout(sb,env,paymentFactory(env),user,body.productId,body.requestId,expected),201);
   }
   if(path==='/api/shop/orders'&&method==='GET'){
    const rows=await sb.rest('doll_payment_orders','?select=*&owner_id=eq.'+encodeURIComponent(user.id)+'&livemode=eq.'+(paymentConfig(env).paymentMode==='live')+'&order=created_at.desc&limit=50');return json({orders:rows.map(orderDTO)});
   }
   const orderMatch=path.match(/^\/api\/shop\/orders\/([0-9a-f-]+)\/sync$/i);
   if(orderMatch&&method==='POST'){
    if(!uuid(orderMatch[1]))throw new AppError('NOT_FOUND',404);
    const rows=await sb.rest('doll_payment_orders','?select=*&id=eq.'+orderMatch[1]+'&owner_id=eq.'+encodeURIComponent(user.id)+'&livemode=eq.'+(paymentConfig(env).paymentMode==='live')+'&limit=1');
    if(!rows?.length)throw new AppError('NOT_FOUND',404);
    if(rows[0].provider_session_id)await reconcileSession(sb,env,paymentFactory(env),rows[0].provider_session_id);
    const fresh=await sb.rest('doll_payment_orders','?select=*&id=eq.'+orderMatch[1]+'&owner_id=eq.'+encodeURIComponent(user.id)+'&limit=1');return json({order:orderDTO(fresh[0])});
   }
   if(path==='/api/gifts'&&method==='GET'){
    const rows=await sb.rest('doll_gifts','?select=id,payload,created_at,expires_at,revoked_at&owner_id=eq.'+encodeURIComponent(user.id)+'&order=created_at.desc&limit=100');return json({gifts:rows});
   }
   if(path==='/api/gifts'&&method==='POST'){
    let gift;try{gift=validateGift(body.gift);}catch(e){throw new AppError(e.message in messages?e.message:'INVALID_GIFT');}
    if(!uuid(body.requestId)||!tokenOK(body.shareToken)||![7,30,90,365].includes(body.expiresInDays))throw new AppError('INVALID_REQUEST');
    const needed=requiredProducts(gift);if(needed.length){const owned=await ownedProducts(sb,env,user.id);if(needed.some(p=>!owned.includes(p)))throw new AppError('LOCKED_PRODUCT',403);}
    const result=await sb.rpc('doll_create_gift',{p_owner:user.id,p_request:body.requestId,p_hash:hash(body.shareToken),p_payload:gift,p_days:body.expiresInDays});
    if(result?.error==='quota')throw new AppError('RATE_LIMITED',429);if(!result?.id)throw new AppError('INVALID_REQUEST',409);
    return json({giftId:result.id,recipientUrl:expected+'/g#'+body.shareToken,expiresAt:result.expires_at},201);
   }
   const match=path.match(/^\/api\/gifts\/([0-9a-f-]+)\/(revoke|restore|rotate)$/i);
   if(match&&method==='POST'){
    const [,giftId,action]=match;if(!uuid(giftId))throw new AppError('NOT_FOUND',404);
    const token=action==='rotate'?randomBytes(24).toString('base64url'):null;
    const patch=action==='rotate'?{share_token_hash:hash(token),revoked_at:null}:action==='revoke'?{revoked_at:new Date().toISOString()}:{revoked_at:null};
    const rows=await sb.rest('doll_gifts','?id=eq.'+giftId+'&owner_id=eq.'+encodeURIComponent(user.id)+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString()),{method:'PATCH',body:patch,prefer:'return=representation'});
    if(!rows?.length)throw new AppError('NOT_FOUND',404);
    return json({ok:true,...(token?{recipientUrl:expected+'/g#'+token,expiresAt:rows[0].expires_at}:{})});
   }
   throw new AppError('NOT_FOUND',404);
  }catch(e){const code=e instanceof AppError?e.code:'SERVICE_UNAVAILABLE';return json({error:code,message:messages[code]||messages.SERVICE_UNAVAILABLE},e instanceof AppError?e.status:503);}
 };
}
