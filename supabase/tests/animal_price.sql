-- Run after 006. Rollback-only assertions; no Stripe calls or persistent grants.
begin;
do $$
declare u uuid; o uuid; result jsonb; sid text;
begin
 select id into u from auth.users limit 1;
 if u is null then raise exception 'Requires existing test user'; end if;
 -- The historical snapshot can settle at its original THB 20 amount.
 insert into public.doll_payment_orders(owner_id,product_id,amount_minor,livemode,request_key,price_version,status)
 values(u,'animal-monkey',2000,false,gen_random_uuid(),1,'expired') returning id into o;
 sid:='cs_test_price_'||replace(o::text,'-','');
 perform public.doll_bind_checkout(o,sid);
 result:=public.doll_apply_payment_event('qa_price_'||o,o,sid,'pi_price_'||o,2000,'thb',false,'paid',0);
 if result->>'ok'<>'true' then raise exception 'Legacy price cannot reconcile'; end if;
 if not exists(select 1 from public.doll_payment_orders where id=o and status='paid' and amount_minor=2000 and price_version=1) then raise exception 'Legacy purchase changed'; end if;
 -- A new price-version row cannot use the old amount.
 begin
  insert into public.doll_payment_orders(owner_id,product_id,amount_minor,livemode,request_key,status)
  values(u,'animal-red-panda',2000,false,gen_random_uuid(),'expired');
  raise exception 'Old animal amount accepted for a new order';
 exception when check_violation then null;
 end;
 if not exists(select 1 from pg_constraint where conrelid='public.doll_payment_orders'::regclass and conname='doll_payment_orders_check') then raise exception 'Refund bounds constraint lost'; end if;
 perform set_config('doll.price_qa','PASS: legacy THB 20 grant retained; new animal orders reject THB 20; refund bounds retained',true);
end;
$$;
select current_setting('doll.price_qa') as result;
rollback;
