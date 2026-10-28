export class AppError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
export function configured(env){return ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','APP_ORIGIN'].every(k=>env[k]&&!env[k].includes('YOUR_PROJECT'))&&(env.APP_MODE==='public'||!!env.OWNER_EMAIL);}
export function supabase(env,fetcher=fetch){
  const base=env.SUPABASE_URL?.replace(/\/$/,'');
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base||''))throw new AppError('SETUP_REQUIRED',503);
  async function call(path,{method='GET',body,token,service=false,prefer}={}){
    const key=service?env.SUPABASE_SECRET_KEY:env.SUPABASE_PUBLISHABLE_KEY;
    const headers={apikey:key,'Content-Type':'application/json'};
    if(token)headers.Authorization='Bearer '+token;
    // sb_secret keys belong in apikey only. Legacy service_role JWTs also need Bearer.
    else if(service&&key?.startsWith('eyJ'))headers.Authorization='Bearer '+key;
    if(prefer)headers.Prefer=prefer;
    let response;try{response=await fetcher(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});}catch{throw new AppError('SERVICE_UNAVAILABLE',503);}
    const text=await response.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new AppError('SERVICE_UNAVAILABLE',503);}
    if(!response.ok){if(response.status===429)throw new AppError('RATE_LIMITED',429);if(path.startsWith('/auth/'))throw new AppError('AUTH_FAILED',401);throw new AppError('DATABASE_UNAVAILABLE',503);}
    return data;
  }
  return {exchange:(auth_code,code_verifier)=>call('/auth/v1/token?grant_type=pkce',{method:'POST',body:{auth_code,code_verifier}}),login:(email,password)=>call('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}}),refresh:refresh_token=>call('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token}}),user:token=>call('/auth/v1/user',{token}),logout:token=>call('/auth/v1/logout?scope=local',{method:'POST',token}),rest:(table,query='',options={})=>call('/rest/v1/'+table+query,{...options,service:true}),rpc:(name,body)=>call('/rest/v1/rpc/'+name,{method:'POST',body,service:true})};
}
