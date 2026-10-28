-- Release failed asynchronous attempts so the buyer can retry a new order.
begin;
alter table public.doll_payment_orders drop constraint doll_payment_orders_status_check;
alter table public.doll_payment_orders add constraint doll_payment_orders_status_check check(status in ('pending','paid','expired','failed','refunded'));
create or replace function public.doll_apply_payment_event(p_event text,p_order uuid,p_session text,p_payment text,p_amount integer,p_currency text,p_live boolean,p_status text,p_refunded integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.doll_payment_orders;
begin
 select * into o from public.doll_payment_orders where id=p_order for update;
 if not found or p_event is null or length(p_event)>255 or p_status is null or p_status not in ('pending','paid','expired','failed','refunded') or p_session is null then return jsonb_build_object('error','conflict'); end if;
 if p_amount is distinct from o.amount_minor or p_currency is distinct from o.currency or p_live is distinct from o.livemode or (o.provider_session_id is not null and o.provider_session_id<>p_session) or (o.provider_payment_id is not null and o.provider_payment_id is distinct from p_payment) or p_refunded is null or p_refunded<0 or p_refunded>o.amount_minor then return jsonb_build_object('error','mismatch'); end if;
 if p_status in ('paid','refunded') and p_payment is null then return jsonb_build_object('error','mismatch'); end if;
 if p_status='refunded' and p_refunded<>o.amount_minor then return jsonb_build_object('error','mismatch'); end if;
 insert into public.doll_payment_events(event_id,order_id,state) values(p_event,p_order,p_status) on conflict do nothing;
 if not found then return jsonb_build_object('ok',true,'duplicate',true); end if;
 -- A delayed completed/expired event never restores refunded access or loses a paid grant.
 if o.status='refunded' then p_status:='refunded';
 elsif o.status='paid' and p_status in ('pending','expired','failed') then p_status:='paid';
 end if;
 update public.doll_payment_orders set status=p_status,provider_session_id=p_session,provider_payment_id=coalesce(o.provider_payment_id,p_payment),paid_at=case when p_status in ('paid','refunded') then coalesce(o.paid_at,now()) else o.paid_at end,refunded_minor=greatest(o.refunded_minor,p_refunded) where id=p_order;
 return jsonb_build_object('ok',true);
end;
$$;
commit;
