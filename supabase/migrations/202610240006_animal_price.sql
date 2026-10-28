-- Owner confirmed animal price: THB 30. Retain historical amounts and paid grants.
begin;
alter table public.doll_payment_orders add column price_version smallint not null default 1 check(price_version in (1,2));
alter table public.doll_payment_orders alter column price_version set default 2;
alter table public.doll_payment_orders drop constraint doll_payment_orders_check1;
alter table public.doll_payment_orders add constraint doll_payment_orders_price_check check(
 amount_minor=case when product_id like 'flower-%' then 1000
 when product_id like 'animal-%' then case when price_version=1 then 2000 else 3000 end
 else 2000 end
);
-- Never rewrite a historical price or remove access. Late provider confirmations still reconcile by order amount.
update public.doll_payment_orders set status='expired' where product_id like 'animal-%' and status='pending' and price_version=1;
create or replace function public.doll_begin_checkout(p_owner uuid,p_product text,p_request uuid,p_live boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.doll_payment_orders;
begin
 if p_product is null or p_product not in ('flower-peony', 'flower-lavender', 'bg-starry', 'bg-cafe', 'flower-carnation', 'flower-gerbera', 'flower-orchid', 'flower-lotus', 'flower-sakura', 'flower-chrysanthemum', 'flower-cosmos', 'flower-poppy', 'flower-iris', 'flower-magnolia', 'flower-gardenia', 'flower-jasmine', 'flower-camellia', 'flower-orange-blossom', 'flower-bluebell', 'flower-delphinium', 'flower-statice', 'flower-lilac', 'flower-daffodil', 'flower-anemone', 'animal-panda', 'animal-red-panda', 'animal-monkey') then raise exception 'invalid product'; end if;
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
 insert into public.doll_payment_orders(owner_id,product_id,amount_minor,livemode,request_key) values(p_owner,p_product,case when p_product like 'flower-%' then 1000 when p_product like 'animal-%' then 3000 else 2000 end,p_live,p_request) returning * into o;
 return jsonb_build_object('order',to_jsonb(o));
end;
$$;
commit;
