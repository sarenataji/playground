-- Permanent, content-free receipts prevent retries from resurrecting deleted notes.
create table public.guest_note_receipts (id uuid primary key);
alter table public.guest_note_receipts enable row level security;
revoke all on public.guest_note_receipts from anon, authenticated;
insert into public.guest_note_receipts(id)
select id from public.guest_notes union select id from public.note_submissions;

create or replace function public.submit_guest_note(p_id uuid, p_message text, p_name text, p_color text, p_stamp text, p_visitor text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_visitor, 0));
  if exists(select 1 from public.guest_note_receipts where id = p_id) then return; end if;
  if exists(select 1 from public.note_submissions where visitor = p_visitor and created_at > now() - interval '1 minute')
    or (select count(*) from public.note_submissions where visitor = p_visitor and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'note_rate_limit';
  end if;
  insert into public.guest_note_receipts(id) values(p_id) on conflict do nothing;
  if not found then return; end if;
  insert into public.guest_notes(id, message, name, color, stamp) values(p_id,btrim(p_message),btrim(p_name),p_color,p_stamp);
  insert into public.note_submissions(id, visitor) values(p_id,p_visitor);
  delete from public.note_submissions where created_at < now() - interval '1 day';
end;
$$;

-- The queue has already validated and rate-limited this note. Preserve its original date.
create function public.import_guest_note(p_id uuid, p_message text, p_name text, p_color text, p_stamp text, p_received_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_received_at is null or p_received_at > now() + interval '5 minutes' then raise exception 'invalid_note_date'; end if;
  insert into public.guest_note_receipts(id) values(p_id) on conflict do nothing;
  if not found then return; end if;
  insert into public.guest_notes(id,message,name,color,stamp,created_at)
  values(p_id,btrim(p_message),btrim(p_name),p_color,p_stamp,p_received_at);
end;
$$;
revoke all on function public.import_guest_note(uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.import_guest_note(uuid,text,text,text,text,timestamptz) to service_role;
