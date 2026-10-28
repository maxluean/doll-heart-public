-- PromptPay orders are independent of the original free trial grants.
-- Test orders NEVER become live ownership. No card/bank data is stored here.
begin;
create table public.doll_payment_orders (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 product_id text not null check(product_id in ('flower-peony','flower-lavender','bg-starry','bg-cafe')),
 amount_minor integer not null,
 currency text not null default 'thb' check(currency='thb'),
 livemode boolean not null,
 request_key uuid not null,
 status text not null default 'pending' check(status in ('pending','paid','expired','refunded')),
 provider_session_id text unique,
 provider_payment_id text unique,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '1 hour',
 paid_at timestamptz,
 refunded_minor integer not null default 0 check(refunded_minor>=0 and refunded_minor<=amount_minor),
 unique(owner_id,request_key,livemode),
 check(amount_minor=case when product_id like 'flower-%' then 1000 else 2000 end)
);
-- Pending requests share a single Checkout. A late settled payment still records even if a newer QR exists.
create unique index doll_one_pending_purchase on public.doll_payment_orders(owner_id,product_id,livemode) where status='pending';
create index doll_payment_owner_created on public.doll_payment_orders(owner_id,created_at desc);
create table public.doll_payment_events (
 event_id text primary key,
 order_id uuid not null references public.doll_payment_orders(id),
 state text not null,
 created_at timestamptz not null default now()
);
alter table public.doll_payment_orders enable row level security;
alter table public.doll_payment_events enable row level security;
revoke all on public.doll_payment_orders,public.doll_payment_events from public,anon,authenticated;
grant select on public.doll_payment_orders to authenticated;
grant all on public.doll_payment_orders,public.doll_payment_events to service_role;
create policy doll_owner_payment_orders on public.doll_payment_orders for select to authenticated using ((select auth.uid())=owner_id);

create function public.doll_begin_checkout(p_owner uuid,p_product text,p_request uuid,p_live boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.doll_payment_orders;
begin
 if p_product is null or p_product not in ('flower-peony','flower-lavender','bg-starry','bg-cafe') then raise exception 'invalid product'; end if;
 perform pg_advisory_xact_lock(hashtextextended('doll-checkout:'||p_owner::text||':'||p_product||':'||p_live::text,0));
 if exists(select 1 from public.doll_entitlements where owner_id=p_owner and product_id=p_product) or exists(select 1 from public.doll_payment_orders where owner_id=p_owner and product_id=p_product and livemode=p_live and status='paid') then return jsonb_build_object('error','owned'); end if;
 select * into o from public.doll_payment_orders where owner_id=p_owner and request_key=p_request and livemode=p_live;
 if found then
  if o.product_id<>p_product then return jsonb_build_object('error','conflict'); end if;
  return jsonb_build_object('order',to_jsonb(o));
 end if;
 select * into o from public.doll_payment_orders where owner_id=p_owner and product_id=p_product and livemode=p_live and status='pending';
 if found then return jsonb_build_object('order',to_jsonb(o)); end if;
 if (select count(*) from public.doll_payment_orders where owner_id=p_owner and created_at>now()-interval '1 hour')>=10 then return jsonb_build_object('error','quota'); end if;
 insert into public.doll_payment_orders(owner_id,product_id,amount_minor,livemode,request_key) values(p_owner,p_product,case when p_product like 'flower-%' then 1000 else 2000 end,p_live,p_request) returning * into o;
 return jsonb_build_object('order',to_jsonb(o));
end;
$$;
create function public.doll_bind_checkout(p_order uuid,p_session text) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.doll_payment_orders;
begin
 select * into o from public.doll_payment_orders where id=p_order for update;
 if not found or p_session is null or p_session !~ '^cs_[A-Za-z0-9_]+$' then return jsonb_build_object('error','conflict'); end if;
 if o.provider_session_id is not null and o.provider_session_id<>p_session then return jsonb_build_object('error','conflict'); end if;
 update public.doll_payment_orders set provider_session_id=p_session where id=p_order;
 return jsonb_build_object('ok',true);
end;
$$;
create function public.doll_apply_payment_event(p_event text,p_order uuid,p_session text,p_payment text,p_amount integer,p_currency text,p_live boolean,p_status text,p_refunded integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.doll_payment_orders;
begin
 select * into o from public.doll_payment_orders where id=p_order for update;
 if not found or p_event is null or length(p_event)>255 or p_status is null or p_status not in ('pending','paid','expired','refunded') or p_session is null then return jsonb_build_object('error','conflict'); end if;
 if p_amount is distinct from o.amount_minor or p_currency is distinct from o.currency or p_live is distinct from o.livemode or (o.provider_session_id is not null and o.provider_session_id<>p_session) or (o.provider_payment_id is not null and o.provider_payment_id is distinct from p_payment) or p_refunded is null or p_refunded<0 or p_refunded>o.amount_minor then return jsonb_build_object('error','mismatch'); end if;
 if p_status in ('paid','refunded') and p_payment is null then return jsonb_build_object('error','mismatch'); end if;
 if p_status='refunded' and p_refunded<>o.amount_minor then return jsonb_build_object('error','mismatch'); end if;
 insert into public.doll_payment_events(event_id,order_id,state) values(p_event,p_order,p_status) on conflict do nothing;
 if not found then return jsonb_build_object('ok',true,'duplicate',true); end if;
 -- A delayed completed/expired event never restores refunded access or loses a paid grant.
 if o.status='refunded' then p_status:='refunded';
 elsif o.status='paid' and p_status in ('pending','expired') then p_status:='paid';
 end if;
 update public.doll_payment_orders set status=p_status,provider_session_id=p_session,provider_payment_id=coalesce(o.provider_payment_id,p_payment),paid_at=case when p_status in ('paid','refunded') then coalesce(o.paid_at,now()) else o.paid_at end,refunded_minor=greatest(o.refunded_minor,p_refunded) where id=p_order;
 return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.doll_begin_checkout(uuid,text,uuid,boolean),public.doll_bind_checkout(uuid,text),public.doll_apply_payment_event(text,uuid,text,text,integer,text,boolean,text,integer) from public,anon,authenticated;
grant execute on function public.doll_begin_checkout(uuid,text,uuid,boolean),public.doll_bind_checkout(uuid,text),public.doll_apply_payment_event(text,uuid,text,text,integer,text,boolean,text,integer) to service_role;
commit;
