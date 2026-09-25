-- Run once in the Supabase SQL editor. Add the owner as described in docs/NOTES.md.
create table public.note_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.note_owners enable row level security;
revoke all on public.note_owners from anon, authenticated;

create function public.is_note_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.note_owners where user_id = (select auth.uid()));
$$;
revoke all on function public.is_note_owner() from public, anon;
grant execute on function public.is_note_owner() to authenticated;

create table public.guest_notes (
  id uuid primary key,
  message text not null check (char_length(btrim(message)) between 1 and 500),
  name text not null default '' check (char_length(name) <= 50),
  color text not null check (color in ('butter','rose','sage','sky')),
  stamp text not null check (stamp in ('flower','star','heart','smile')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  favorite boolean not null default false,
  archived boolean not null default false
);
create index guest_notes_created_at on public.guest_notes(created_at desc);
alter table public.guest_notes enable row level security;
revoke all on public.guest_notes from anon, authenticated;
grant select, delete on public.guest_notes to authenticated;
grant update (read_at, favorite, archived) on public.guest_notes to authenticated;
create policy owner_read on public.guest_notes for select to authenticated using ((select public.is_note_owner()));
create policy owner_update on public.guest_notes for update to authenticated
using ((select public.is_note_owner())) with check ((select public.is_note_owner()));
create policy owner_delete on public.guest_notes for delete to authenticated using ((select public.is_note_owner()));

create table public.note_submissions (
  id uuid primary key,
  visitor text not null,
  created_at timestamptz not null default now()
);
create index note_submissions_visitor_time on public.note_submissions(visitor, created_at);
alter table public.note_submissions enable row level security;
revoke all on public.note_submissions from anon, authenticated;

-- Only the server may submit. Rate limits persist across function instances.
create function public.submit_guest_note(p_id uuid, p_message text, p_name text, p_color text, p_stamp text, p_visitor text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_visitor, 0));
  -- An uncertain network response can be retried without creating another note.
  if exists(select 1 from public.note_submissions where id = p_id and visitor = p_visitor) then return; end if;
  if exists(select 1 from public.note_submissions where visitor = p_visitor and created_at > now() - interval '1 minute')
    or (select count(*) from public.note_submissions where visitor = p_visitor and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'note_rate_limit';
  end if;
  insert into public.guest_notes(id, message, name, color, stamp) values (p_id, btrim(p_message), btrim(p_name), p_color, p_stamp);
  insert into public.note_submissions(id, visitor) values (p_id, p_visitor);
  delete from public.note_submissions where created_at < now() - interval '1 day';
end;
$$;
revoke all on function public.submit_guest_note(uuid,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_guest_note(uuid,text,text,text,text,text) to service_role;
