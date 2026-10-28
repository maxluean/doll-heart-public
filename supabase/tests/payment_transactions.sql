-- Run in SQL Editor AFTER migrations 003 and 004. All fixture rows are rolled back.
-- This never calls Stripe, creates a real charge, or retains a purchase grant.
begin;
do $$
declare u uuid; u2 uuid; r jsonb; r2 jsonb; oid uuid; sid text; pi text; req uuid:=gen_random_uuid();
begin
 select id into u from auth.users where not exists(select 1 from public.doll_entitlements e where e.owner_id=auth.users.id and e.product_id='flower-peony') limit 1;
 if u is null then raise exception 'QA requires one existing user without peony'; end if;
 r:=public.doll_begin_checkout(u,'flower-peony',req,false);oid:=(r->'order'->>'id')::uuid;
 if oid is null or (r->'order'->>'amount_minor')::int<>1000 then raise exception 'wrong price/order'; end if;
 r2:=public.doll_begin_checkout(u,'flower-peony',gen_random_uuid(),false);
 if r2->'order'->>'id'<>oid::text then raise exception 'duplicate pending checkout'; end if;
 sid:='cs_test_sql_'||replace(oid::text,'-','');pi:='pi_sql_'||replace(oid::text,'-','');
 r:=public.doll_bind_checkout(oid,sid);if r->>'ok'<>'true' then raise exception 'bind failed'; end if;
 r:=public.doll_bind_checkout(oid,sid||'wrong');if r->>'error'<>'conflict' then raise exception 'rebind accepted'; end if;
 r:=public.doll_apply_payment_event('qa_bad_'||oid,oid,sid,pi,1,'thb',false,'paid',0);if r->>'error'<>'mismatch' then raise exception 'forged amount accepted'; end if;
 r:=public.doll_apply_payment_event('qa_paid_'||oid,oid,sid,pi,1000,'thb',false,'paid',0);if r->>'ok'<>'true' then raise exception 'paid failed'; end if;
 r:=public.doll_apply_payment_event('qa_paid_'||oid,oid,sid,pi,1000,'thb',false,'paid',0);if r->>'duplicate'<>'true' then raise exception 'replay failed'; end if;
 if exists(select 1 from public.doll_entitlements where owner_id=u and product_id='flower-peony') then raise exception 'test polluted live grants'; end if;
 r:=public.doll_begin_checkout(u,'flower-peony',gen_random_uuid(),false);if r->>'error'<>'owned' then raise exception 'repurchase allowed'; end if;
 r:=public.doll_apply_payment_event('qa_expired_'||oid,oid,sid,pi,1000,'thb',false,'expired',0);
 if (select status from public.doll_payment_orders where id=oid)<>'paid' then raise exception 'expired lost paid access'; end if;
 r:=public.doll_apply_payment_event('qa_partial_'||oid,oid,sid,pi,1000,'thb',false,'paid',300);
 r:=public.doll_apply_payment_event('qa_refund_'||oid,oid,sid,pi,1000,'thb',false,'refunded',1000);
 r:=public.doll_apply_payment_event('qa_delayed_'||oid,oid,sid,pi,1000,'thb',false,'paid',0);
 if (select status from public.doll_payment_orders where id=oid)<>'refunded' then raise exception 'refund reactivated'; end if;
 if (select refunded_minor from public.doll_payment_orders where id=oid)<>1000 then raise exception 'refund amount regressed'; end if;
 r:=public.doll_begin_checkout(u,'bg-cafe',gen_random_uuid(),false);oid:=(r->'order'->>'id')::uuid;
 sid:='cs_test_sql_'||replace(oid::text,'-','');pi:='pi_sql_'||replace(oid::text,'-','');
 perform public.doll_bind_checkout(oid,sid);
 r:=public.doll_apply_payment_event('qa_failed_'||oid,oid,sid,pi,2000,'thb',false,'failed',0);
 if (select status from public.doll_payment_orders where id=oid)<>'failed' then raise exception 'failed state rejected'; end if;
 r2:=public.doll_begin_checkout(u,'bg-cafe',gen_random_uuid(),false);
 if r2->'order'->>'id'=oid::text then raise exception 'failed checkout reused'; end if;
 perform public.doll_apply_payment_event('qa_late_paid_'||oid,oid,sid,pi,2000,'thb',false,'paid',0);
 perform public.doll_apply_payment_event('qa_old_failed_'||oid,oid,sid,pi,2000,'thb',false,'failed',0);
 if (select status from public.doll_payment_orders where id=oid)<>'paid' then raise exception 'failed event lost paid access'; end if;
 if has_table_privilege('anon','public.doll_payment_orders','select') or has_table_privilege('authenticated','public.doll_payment_orders','insert') or has_table_privilege('authenticated','public.doll_payment_events','select') or has_function_privilege('authenticated','public.doll_begin_checkout(uuid,text,uuid,boolean)','execute') then raise exception 'unsafe direct permissions'; end if;
 select id into u2 from auth.users where id<>u limit 1;
 if u2 is not null then perform public.doll_begin_checkout(u2,'bg-cafe',gen_random_uuid(),false); end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
end;
$$;
set local role authenticated;
select case when count(*)>0 and count(*) filter(where owner_id<>auth.uid())=0 then 'PASS: SQL transitions, idempotency, test/live separation, permissions and owner RLS' else 'FAIL: RLS test' end as payment_qa from public.doll_payment_orders;
reset role;
rollback;
