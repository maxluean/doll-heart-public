-- Public beta: bounded storage growth. Existing gifts and ownership policies are unchanged.
begin;
create index if not exists doll_gifts_created on public.doll_gifts(created_at);
create or replace function public.doll_create_gift(p_owner uuid,p_request uuid,p_hash text,p_payload jsonb,p_days integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.doll_gifts; new_gift public.doll_gifts;
begin
 if p_days not in (7,30,90,365) then raise exception 'invalid expiry'; end if;
 -- Serialize only gift creation so quotas hold across accounts and concurrent requests.
 perform pg_advisory_xact_lock(hashtextextended('doll-heart-global-create',0));
 select * into existing from public.doll_gifts where owner_id=p_owner and request_key=p_request;
 if found then
  if existing.share_token_hash<>p_hash or existing.payload<>p_payload or existing.revoked_at is not null or existing.expires_at<=now() then return jsonb_build_object('error','conflict'); end if;
  return jsonb_build_object('id',existing.id,'expires_at',existing.expires_at);
 end if;
 if (select count(*) from public.doll_gifts where owner_id=p_owner and created_at>now()-interval '1 day')>=20 or
    (select count(*) from public.doll_gifts where created_at>now()-interval '1 day')>=200 or
    (select count(*) from public.doll_gifts)>=5000 then return jsonb_build_object('error','quota'); end if;
 insert into public.doll_gifts(owner_id,request_key,payload,share_token_hash,expires_at) values(p_owner,p_request,p_payload,p_hash,now()+make_interval(days=>p_days)) returning * into new_gift;
 return jsonb_build_object('id',new_gift.id,'expires_at',new_gift.expires_at);
end;
$$;
commit;
