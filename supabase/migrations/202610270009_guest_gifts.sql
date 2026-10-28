-- Guest checkout: one payment buys one immutable gift, not an account entitlement.
-- Legacy gifts/orders remain intact and readable. New tables have no public grants.
begin;
create table public.doll_guest_gifts (
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique,
 manage_hash text not null unique check(manage_hash ~ '^[0-9a-f]{64}$'),
 share_token_hash text not null unique check(share_token_hash ~ '^[0-9a-f]{64}$'),
 device_hash text not null, ip_hash text not null,
 payload jsonb check(payload is null or (jsonb_typeof(payload)='object' and octet_length(payload::text)<=32768)),
 items jsonb not null check(jsonb_typeof(items)='array'),
 amount_minor integer not null check(amount_minor between 0 and 15000), currency text not null default 'thb' check(currency='thb'),
 duration_hours integer not null check(duration_hours in (1,720)), livemode boolean not null,
 status text not null check(status in ('free','pending','paid','failed','expired','refunded')),
 provider_session_id text unique, provider_payment_id text unique,
 created_at timestamptz not null default now(), checkout_expires_at timestamptz not null default now()+interval '24 hours',
 paid_at timestamptz, expires_at timestamptz, revoked_at timestamptz, purged_at timestamptz, last_sync_at timestamptz,
 refunded_minor integer not null default 0 check(refunded_minor>=0 and refunded_minor<=amount_minor),
 check((amount_minor=0 and duration_hours=1 and status='free') or (amount_minor>0 and duration_hours=720 and status<>'free'))
);
create index doll_guest_created on public.doll_guest_gifts(created_at);
create index doll_guest_device_created on public.doll_guest_gifts(device_hash,created_at);
create index doll_guest_ip_created on public.doll_guest_gifts(ip_hash,created_at);
create index doll_guest_expiry on public.doll_guest_gifts(expires_at) where payload is not null;
create table public.doll_guest_events(id text primary key,gift_id uuid not null references public.doll_guest_gifts(id),created_at timestamptz not null default now());
alter table public.doll_guest_gifts enable row level security;
alter table public.doll_guest_events enable row level security;
revoke all on public.doll_guest_gifts,public.doll_guest_events from anon,authenticated;
grant all on public.doll_guest_gifts,public.doll_guest_events to service_role;

create function public.doll_guest_begin(p_request uuid,p_manage text,p_share text,p_device text,p_ip text,p_payload jsonb,p_month boolean,p_live boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.doll_guest_gifts; lines jsonb; amount integer; hours integer;
begin
 if p_manage !~ '^[0-9a-f]{64}$' or p_share !~ '^[0-9a-f]{64}$' or p_device !~ '^[0-9a-f]{64}$' or p_ip !~ '^[0-9a-f]{64}$' or p_payload is null or p_month is null or p_live is null then raise exception 'invalid gift'; end if;
 perform pg_advisory_xact_lock(hashtextextended('doll-guest-create',0));
 select * into g from public.doll_guest_gifts where request_key=p_request;
 if found then
  if g.manage_hash<>p_manage or g.share_token_hash<>p_share or g.payload is distinct from p_payload or g.livemode<>p_live or (g.duration_hours=720)<>p_month then return jsonb_build_object('error','conflict'); end if;
  return jsonb_build_object('gift',to_jsonb(g));
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p->>'id','name',p->>'name','amountMinor',(p->>'amountMinor')::integer) order by n),'[]'::jsonb) into lines
 from jsonb_array_elements('[{"id": "flower-peony", "type": "flower", "asset": "peony", "name": "โบตั๋นใจฟู", "amountMinor": 1000}, {"id": "flower-lavender", "type": "flower", "asset": "lavender", "name": "ลาเวนเดอร์อุ่นใจ", "amountMinor": 1000}, {"id": "bg-starry", "type": "background", "asset": "starry", "name": "คืนดาวของเรา", "amountMinor": 2000}, {"id": "bg-cafe", "type": "background", "asset": "cafe", "name": "คาเฟ่วันเดต", "amountMinor": 2000}, {"id": "flower-carnation", "type": "flower", "asset": "carnation", "name": "คาร์เนชั่น", "amountMinor": 1000}, {"id": "flower-gerbera", "type": "flower", "asset": "gerbera", "name": "เยอบีร่า", "amountMinor": 1000}, {"id": "flower-orchid", "type": "flower", "asset": "orchid", "name": "กล้วยไม้", "amountMinor": 1000}, {"id": "flower-lotus", "type": "flower", "asset": "lotus", "name": "บัว", "amountMinor": 1000}, {"id": "flower-sakura", "type": "flower", "asset": "sakura", "name": "ซากุระ", "amountMinor": 1000}, {"id": "flower-chrysanthemum", "type": "flower", "asset": "chrysanthemum", "name": "เบญจมาศ", "amountMinor": 1000}, {"id": "flower-cosmos", "type": "flower", "asset": "cosmos", "name": "คอสมอส", "amountMinor": 1000}, {"id": "flower-poppy", "type": "flower", "asset": "poppy", "name": "ป๊อปปี้", "amountMinor": 1000}, {"id": "flower-iris", "type": "flower", "asset": "iris", "name": "ไอริส", "amountMinor": 1000}, {"id": "flower-magnolia", "type": "flower", "asset": "magnolia", "name": "แมกโนเลีย", "amountMinor": 1000}, {"id": "flower-gardenia", "type": "flower", "asset": "gardenia", "name": "พุดซ้อน", "amountMinor": 1000}, {"id": "flower-jasmine", "type": "flower", "asset": "jasmine", "name": "มะลิ", "amountMinor": 1000}, {"id": "flower-camellia", "type": "flower", "asset": "camellia", "name": "คามีเลีย", "amountMinor": 1000}, {"id": "flower-orange-blossom", "type": "flower", "asset": "orange-blossom", "name": "ดอกส้ม", "amountMinor": 1000}, {"id": "flower-bluebell", "type": "flower", "asset": "bluebell", "name": "บลูเบลล์", "amountMinor": 1000}, {"id": "flower-delphinium", "type": "flower", "asset": "delphinium", "name": "เดลฟิเนียม", "amountMinor": 1000}, {"id": "flower-statice", "type": "flower", "asset": "statice", "name": "สแตติส", "amountMinor": 1000}, {"id": "flower-lilac", "type": "flower", "asset": "lilac", "name": "ไลแลค", "amountMinor": 1000}, {"id": "flower-daffodil", "type": "flower", "asset": "daffodil", "name": "แดฟโฟดิล", "amountMinor": 1000}, {"id": "flower-anemone", "type": "flower", "asset": "anemone", "name": "อะเนโมนี", "amountMinor": 1000}, {"id": "animal-panda", "type": "animal", "asset": "panda", "name": "หมีแพนด้า", "amountMinor": 3000}, {"id": "animal-red-panda", "type": "animal", "asset": "red-panda", "name": "แพนด้าแดง", "amountMinor": 3000}, {"id": "animal-monkey", "type": "animal", "asset": "monkey", "name": "ลิง", "amountMinor": 3000}, {"id": "bg-glasshouse", "type": "background", "asset": "glasshouse", "name": "เรือนกระจกดอกไม้", "amountMinor": 4000}, {"id": "bg-sunset-picnic", "type": "background", "asset": "sunset-picnic", "name": "ปิกนิกริมทะเลยามเย็น", "amountMinor": 4000}, {"id": "bg-cozy-room", "type": "background", "asset": "cozy-room", "name": "ห้องอุ่นไอรัก", "amountMinor": 4000}, {"id": "bg-sakura-lantern", "type": "background", "asset": "sakura-lantern", "name": "สวนซากุระโคมไฟ", "amountMinor": 4000}, {"id": "bg-starlight-rooftop", "type": "background", "asset": "starlight-rooftop", "name": "ดาดฟ้านับดาว", "amountMinor": 4000}]'::jsonb) with ordinality as c(p,n)
 where (p->>'type'='animal' and p->>'asset'=p_payload->>'animal') or (p->>'type'='background' and p->>'asset'=p_payload->>'background') or (p->>'type'='flower' and exists(select 1 from jsonb_array_elements(p_payload->'flowers') f where f->>'id'=p->>'asset'));
 if jsonb_array_length(lines)>0 then hours=720;
 elsif p_month then hours=720;lines=jsonb_build_array(jsonb_build_object('id','link-30-days','name','เก็บลิงก์ของขวัญ 30 วัน','amountMinor',1900));
 else hours=1; end if;
 select coalesce(sum((x->>'amountMinor')::integer),0) into amount from jsonb_array_elements(lines) x;
 -- Retain expired content for seven days, then prune bounded batches during new
 -- creations. Transaction metadata remains; no legacy/account data is touched.
 update public.doll_guest_gifts set payload=null,purged_at=now(),device_hash='',ip_hash=''
 where id in (select id from public.doll_guest_gifts where payload is not null and ((expires_at<now()-interval '7 days' and status in ('free','paid','refunded')) or (checkout_expires_at<now()-interval '7 days' and status in ('pending','failed','expired'))) limit 100);
 if (select count(*) from public.doll_guest_gifts where device_hash=p_device and created_at>now()-interval '24 hours')>=5 or
 (select count(*) from public.doll_guest_gifts where ip_hash=p_ip and created_at>now()-interval '24 hours')>=50 or
 (select count(*) from public.doll_guest_gifts where created_at>now()-interval '24 hours')>=2000 or
 (select count(*) from public.doll_guest_gifts where payload is not null)>=50000 then return jsonb_build_object('error','quota'); end if;
 insert into public.doll_guest_gifts(request_key,manage_hash,share_token_hash,device_hash,ip_hash,payload,items,amount_minor,duration_hours,livemode,status,expires_at)
 values(p_request,p_manage,p_share,p_device,p_ip,p_payload,lines,amount,hours,p_live,case when amount=0 then 'free' else 'pending' end,case when amount=0 then now()+interval '1 hour' else null end) returning * into g;
 return jsonb_build_object('gift',to_jsonb(g));
end;
$$;
create function public.doll_guest_bind(p_id uuid,p_session text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 update public.doll_guest_gifts set provider_session_id=p_session where id=p_id and amount_minor>0 and (provider_session_id is null or provider_session_id=p_session);
 if not found then return jsonb_build_object('error','conflict'); end if;return jsonb_build_object('ok',true);
end;$$;
create function public.doll_guest_claim_sync(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 update public.doll_guest_gifts set last_sync_at=now() where id=p_id and (last_sync_at is null or last_sync_at<now()-interval '5 seconds');
 return jsonb_build_object('ok',found);
end;$$;
create function public.doll_guest_payment(p_event text,p_id uuid,p_session text,p_payment text,p_amount integer,p_live boolean,p_status text,p_refunded integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.doll_guest_gifts; target text;
begin
 select * into g from public.doll_guest_gifts where id=p_id for update;
 if not found or g.amount_minor=0 or g.amount_minor<>p_amount or g.livemode<>p_live or p_status not in ('pending','paid','failed','expired','refunded') or p_refunded<0 or p_refunded>g.amount_minor or (g.provider_session_id is not null and g.provider_session_id<>p_session) or (g.provider_payment_id is not null and g.provider_payment_id is distinct from p_payment) then return jsonb_build_object('error','mismatch'); end if;
 if p_status='refunded' and p_refunded<>g.amount_minor then return jsonb_build_object('error','mismatch'); end if;
 insert into public.doll_guest_events(id,gift_id) values(p_event,p_id) on conflict do nothing;
 if not found then return jsonb_build_object('ok',true,'duplicate',true); end if;
 target=p_status;
 if g.status='refunded' then target='refunded';elsif g.status='paid' and target in ('pending','failed','expired') then target='paid';end if;
 update public.doll_guest_gifts set status=target,provider_session_id=p_session,provider_payment_id=coalesce(provider_payment_id,p_payment),refunded_minor=greatest(refunded_minor,p_refunded),paid_at=case when target in ('paid','refunded') then coalesce(paid_at,now()) else paid_at end,expires_at=case when target in ('paid','refunded') then coalesce(expires_at,now()+interval '30 days') else expires_at end where id=p_id;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.doll_guest_begin(uuid,text,text,text,text,jsonb,boolean,boolean),public.doll_guest_bind(uuid,text),public.doll_guest_claim_sync(uuid),public.doll_guest_payment(text,uuid,text,text,integer,boolean,text,integer) from public,anon,authenticated;
grant execute on function public.doll_guest_begin(uuid,text,text,text,text,jsonb,boolean,boolean),public.doll_guest_bind(uuid,text),public.doll_guest_claim_sync(uuid),public.doll_guest_payment(text,uuid,text,text,integer,boolean,text,integer) to service_role;
commit;
