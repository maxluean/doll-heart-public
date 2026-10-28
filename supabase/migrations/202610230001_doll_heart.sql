begin;
create table public.doll_gifts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 request_key uuid not null,
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=32768),
 share_token_hash text not null unique check (share_token_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 unique(owner_id,request_key),
 check (expires_at>created_at)
);
create index doll_gifts_owner_created on public.doll_gifts(owner_id,created_at desc);
create table public.doll_entitlements (
 owner_id uuid not null references auth.users(id),
 product_id text not null check (product_id in ('flower-peony','flower-lavender','bg-starry','bg-cafe')),
 source text not null check (source in ('trial','purchase','gift')),
 created_at timestamptz not null default now(),
 primary key(owner_id,product_id)
);
create table public.doll_orders (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 product_id text not null,
 mode text not null check (mode='trial'),
 amount integer not null check(amount=0),
 status text not null check(status='trial_granted'),
 created_at timestamptz not null default now(),
 unique(owner_id,product_id,mode)
);
alter table public.doll_gifts enable row level security;
alter table public.doll_entitlements enable row level security;
alter table public.doll_orders enable row level security;
revoke all on public.doll_gifts,public.doll_entitlements,public.doll_orders from anon,authenticated;
grant select on public.doll_gifts,public.doll_entitlements,public.doll_orders to authenticated;
grant all on public.doll_gifts,public.doll_entitlements,public.doll_orders to service_role;
create policy doll_owner_gifts on public.doll_gifts for select to authenticated using ((select auth.uid())=owner_id);
create policy doll_owner_entitlements on public.doll_entitlements for select to authenticated using ((select auth.uid())=owner_id);
create policy doll_owner_orders on public.doll_orders for select to authenticated using ((select auth.uid())=owner_id);
create function public.doll_trial_unlock(p_owner uuid,p_product text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_product not in ('flower-peony','flower-lavender','bg-starry','bg-cafe') then raise exception 'invalid product'; end if;
 insert into public.doll_orders(owner_id,product_id,mode,amount,status) values(p_owner,p_product,'trial',0,'trial_granted') on conflict do nothing;
 insert into public.doll_entitlements(owner_id,product_id,source) values(p_owner,p_product,'trial') on conflict do nothing;
end;
$$;
create function public.doll_create_gift(p_owner uuid,p_request uuid,p_hash text,p_payload jsonb,p_days integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.doll_gifts; new_gift public.doll_gifts;
begin
 if p_days not in (7,30,90,365) then raise exception 'invalid expiry'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
 select * into existing from public.doll_gifts where owner_id=p_owner and request_key=p_request;
 if found then
  if existing.share_token_hash<>p_hash or existing.payload<>p_payload or existing.revoked_at is not null or existing.expires_at<=now() then return jsonb_build_object('error','conflict'); end if;
  return jsonb_build_object('id',existing.id,'expires_at',existing.expires_at);
 end if;
 if (select count(*) from public.doll_gifts where owner_id=p_owner and created_at>now()-interval '1 day')>=50 then return jsonb_build_object('error','quota'); end if;
 insert into public.doll_gifts(owner_id,request_key,payload,share_token_hash,expires_at) values(p_owner,p_request,p_payload,p_hash,now()+make_interval(days=>p_days)) returning * into new_gift;
 return jsonb_build_object('id',new_gift.id,'expires_at',new_gift.expires_at);
end;
$$;
revoke all on function public.doll_trial_unlock(uuid,text),public.doll_create_gift(uuid,uuid,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.doll_trial_unlock(uuid,text),public.doll_create_gift(uuid,uuid,text,jsonb,integer) to service_role;
commit;
