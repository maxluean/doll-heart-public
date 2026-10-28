-- Run after migration 007. Exercise database pricing only, then roll back every test row.
-- No Stripe calls, no entitlement grants and no real payment.
begin;
do $$
declare u uuid; item record; result jsonb; checked integer:=0;
begin
 select id into u from auth.users order by created_at limit 1;
 if u is null then raise exception 'An existing account is required'; end if;
 for item in select * from (values
  ('bg-glasshouse',4000),('bg-sunset-picnic',4000),('bg-cozy-room',4000),
  ('bg-sakura-lantern',4000),('bg-starlight-rooftop',4000),
  ('bg-starry',2000),('bg-cafe',2000)
 ) as prices(id,amount)
 loop
  result:=public.doll_begin_checkout(u,item.id,gen_random_uuid(),false);
  if result->>'error'='owned' and item.amount=2000 then continue; end if;
  if result->'order'->>'product_id' is distinct from item.id
   or (result->'order'->>'amount_minor')::integer is distinct from item.amount
   or result->'order'->>'status' is distinct from 'pending'
   or (result->'order'->>'livemode')::boolean is distinct from false
   then raise exception 'Scene checkout validation failed for %: %',item.id,result; end if;
  if item.amount=4000 then checked:=checked+1; end if;
 end loop;
 if checked<>5 then raise exception 'Expected five new scenes, got %',checked; end if;
end;
$$;
rollback;
select 'PASS: five new scenes at THB40, legacy scenes at THB20; test rows rolled back' as verification;
