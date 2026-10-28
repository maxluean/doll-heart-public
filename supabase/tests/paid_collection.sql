-- Run after migration 006. No Stripe calls, no persistent purchases.
begin;
do $$
declare u uuid; item record; result jsonb; o uuid; sid text; request uuid; n integer:=0;
begin
 select id into u from auth.users limit 1;
 if u is null then raise exception 'Requires an existing test user'; end if;
 for item in select * from (values
('flower-carnation',1000),
('flower-gerbera',1000),
('flower-orchid',1000),
('flower-lotus',1000),
('flower-sakura',1000),
('flower-chrysanthemum',1000),
('flower-cosmos',1000),
('flower-poppy',1000),
('flower-iris',1000),
('flower-magnolia',1000),
('flower-gardenia',1000),
('flower-jasmine',1000),
('flower-camellia',1000),
('flower-orange-blossom',1000),
('flower-bluebell',1000),
('flower-delphinium',1000),
('flower-statice',1000),
('flower-lilac',1000),
('flower-daffodil',1000),
('flower-anemone',1000),
('animal-panda',3000),
('animal-red-panda',3000),
('animal-monkey',3000)) as p(id,price) loop
  -- Keep quota coverage in normal checkout; isolate each fixture's timestamp for this rollback-only matrix.
  update public.doll_payment_orders set created_at=now()-interval '2 hours' where owner_id=u and livemode=false and created_at>now()-interval '1 hour';
  request:=gen_random_uuid();result:=public.doll_begin_checkout(u,item.id,request,false);o:=(result->'order'->>'id')::uuid;
  if o is null or (result->'order'->>'amount_minor')::integer<>item.price then raise exception 'wrong catalog price: %',item.id; end if;
  sid:='cs_test_matrix_'||replace(o::text,'-','');
  perform public.doll_bind_checkout(o,sid);
  result:=public.doll_apply_payment_event('qa_matrix_'||o,o,sid,'pi_matrix_'||o,item.price,'thb',false,'paid',0);
  if result->>'ok'<>'true' then raise exception 'cannot grant: %',item.id; end if;
  if not exists(select 1 from public.doll_payment_orders where id=o and status='paid' and livemode=false) then raise exception 'wrong state: %',item.id; end if;
  if exists(select 1 from public.doll_entitlements where owner_id=u and product_id=item.id) then raise exception 'test grant leaked: %',item.id; end if;
  n:=n+1;
 end loop;
 if n<>23 then raise exception 'wrong count %',n; end if;
 perform set_config('doll.catalog_qa','PASS: all 23 new paid products, fixed prices, paid transitions and sandbox grant isolation',true);
end;
$$;
select current_setting('doll.catalog_qa') as result;
rollback;
