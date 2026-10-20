-- Phase 1 foundation: tenancy, memberships, roles, audit, document numbering.
-- Every tenant table carries farm_id and is protected by RLS through app.has_farm_role().

create schema if not exists app;
grant usage on schema app to authenticated;

-- Supabase grants table privileges to anon by default; this app has no anonymous data access.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon, public;

create type public.farm_role as enum ('owner', 'manager', 'accountant', 'worker');
create type public.farm_category as enum ('dairy', 'livestock', 'poultry', 'mixed', 'other');

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.farms (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(btrim(name)) between 2 and 120),
  category          public.farm_category not null,
  address           text,
  phone             text,
  logo_path         text,
  timezone          text not null default 'Asia/Karachi',
  currency          char(3) not null default 'PKR',
  language          text not null default 'en',
  settings          jsonb not null default '{}'::jsonb,
  client_request_id uuid,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) default auth.uid(),
  updated_at        timestamptz,
  updated_by        uuid,
  unique (created_by, client_request_id)
);

create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  updated_by uuid
);

create table public.farm_memberships (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.farm_role not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz,
  updated_by uuid,
  unique (farm_id, user_id)
);
create index farm_memberships_user_idx on public.farm_memberships (user_id) where active;

create table public.farm_invitations (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references public.farms (id) on delete cascade,
  email       text not null check (email = lower(btrim(email)) and email like '%@%'),
  role        public.farm_role not null,
  token_hash  text not null unique,
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid()
);
create index farm_invitations_farm_idx on public.farm_invitations (farm_id);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  farm_id    uuid not null,
  table_name text not null,
  record_id  uuid,
  action     text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data   jsonb,
  new_data   jsonb,
  actor      uuid default auth.uid(),
  at         timestamptz not null default now()
);
create index audit_log_farm_at_idx on public.audit_log (farm_id, at desc);
create index audit_log_record_idx on public.audit_log (record_id);

create table public.doc_counters (
  farm_id  uuid not null references public.farms (id) on delete cascade,
  doc_type text not null,
  year     int not null,
  next_no  int not null default 1,
  primary key (farm_id, doc_type, year)
);

-- ---------------------------------------------------------------------------
-- Helper functions (schema app is not exposed through the API)
-- ---------------------------------------------------------------------------

create function app.has_farm_role(p_farm uuid, p_roles public.farm_role[] default null)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_memberships m
    where m.farm_id = p_farm
      and m.user_id = auth.uid()
      and m.active
      and (p_roles is null or m.role = any (p_roles))
  );
$$;

create function app.is_farm_member(p_farm uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select app.has_farm_role(p_farm, null); $$;

create function app.assert_farm_role(p_farm uuid, p_roles public.farm_role[] default null)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not app.has_farm_role(p_farm, p_roles) then
    raise exception 'not authorized for this farm' using errcode = '42501';
  end if;
end;
$$;

-- True when the caller is an active owner/manager of a farm the given user belongs to.
-- Workers and accountants cannot browse co-workers' contact details.
create function app.can_view_profile(p_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.farm_memberships mine
    join public.farm_memberships theirs on theirs.farm_id = mine.farm_id
    where mine.user_id = auth.uid() and mine.active
      and mine.role in ('owner', 'manager')
      and theirs.user_id = p_user
  );
$$;

-- Maintains updated_at/updated_by and forbids moving a row to another farm.
create function app.touch_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if to_jsonb(new) ? 'farm_id' and (to_jsonb(new) ->> 'farm_id') is distinct from (to_jsonb(old) ->> 'farm_id') then
    raise exception 'farm_id cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function app.audit_row()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_row  jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_farm uuid  := coalesce((v_row ->> 'farm_id')::uuid, case when tg_table_name = 'farms' then (v_row ->> 'id')::uuid end);
begin
  insert into public.audit_log (farm_id, table_name, record_id, action, old_data, new_data)
  values (
    v_farm,
    tg_table_name,
    (v_row ->> 'id')::uuid,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

-- Returns e.g. SAL-2026-00042. The counter row is locked, so concurrent calls never share a number.
create function app.next_doc_number(p_farm uuid, p_doc_type text, p_date date default current_date)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_year int := extract(year from p_date);
  v_no   int;
begin
  insert into public.doc_counters as c (farm_id, doc_type, year, next_no)
  values (p_farm, p_doc_type, v_year, 2)
  on conflict (farm_id, doc_type, year) do update set next_no = c.next_no + 1
  returning c.next_no - 1 into v_no;
  return format('%s-%s-%s', p_doc_type, v_year, lpad(v_no::text, 5, '0'));
end;
$$;

-- A farm must always keep at least one active owner.
create function app.protect_last_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'owner' and old.active
     and (tg_op = 'DELETE' or new.role <> 'owner' or not new.active)
     and not exists (
       select 1 from public.farm_memberships
       where farm_id = old.farm_id and role = 'owner' and active and id <> old.id
     ) then
    raise exception 'a farm must keep at least one active owner' using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- Creates a profile for every new auth user.
create function app.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, lower(new.email), nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

create trigger farms_touch before update on public.farms
  for each row execute function app.touch_row();
create trigger profiles_touch before update on public.profiles
  for each row execute function app.touch_row();
create trigger farm_memberships_touch before update on public.farm_memberships
  for each row execute function app.touch_row();
create trigger farm_memberships_last_owner before update or delete on public.farm_memberships
  for each row execute function app.protect_last_owner();

create trigger farms_audit after insert or update or delete on public.farms
  for each row execute function app.audit_row();
create trigger farm_memberships_audit after insert or update or delete on public.farm_memberships
  for each row execute function app.audit_row();
create trigger farm_invitations_audit after insert or update or delete on public.farm_invitations
  for each row execute function app.audit_row();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.farms            enable row level security;
alter table public.profiles         enable row level security;
alter table public.farm_memberships enable row level security;
alter table public.farm_invitations enable row level security;
alter table public.audit_log        enable row level security;
alter table public.doc_counters     enable row level security;

-- Farms are created only through create_farm_with_template().
create policy farms_select on public.farms for select to authenticated
  using ((select app.is_farm_member(id)));
create policy farms_update on public.farms for update to authenticated
  using ((select app.has_farm_role(id, '{owner}')))
  with check ((select app.has_farm_role(id, '{owner}')));

create policy profiles_select on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select app.can_view_profile(user_id)));
create policy profiles_update on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Memberships are created only through RPCs. Owners and managers see the team; others see their own row.
create policy farm_memberships_select on public.farm_memberships for select to authenticated
  using (user_id = (select auth.uid()) or (select app.has_farm_role(farm_id, '{owner,manager}')));
create policy farm_memberships_update on public.farm_memberships for update to authenticated
  using ((select app.has_farm_role(farm_id, '{owner}')))
  with check ((select app.has_farm_role(farm_id, '{owner}')));
create policy farm_memberships_delete on public.farm_memberships for delete to authenticated
  using ((select app.has_farm_role(farm_id, '{owner}')));

create policy farm_invitations_select on public.farm_invitations for select to authenticated
  using ((select app.has_farm_role(farm_id, '{owner}')));
create policy farm_invitations_delete on public.farm_invitations for delete to authenticated
  using ((select app.has_farm_role(farm_id, '{owner}')));

create policy audit_log_select on public.audit_log for select to authenticated
  using ((select app.has_farm_role(farm_id, '{owner}')));

-- doc_counters: no policies; reachable only through app.next_doc_number().

revoke all on all tables in schema public from anon;
revoke insert on public.farms, public.farm_memberships, public.farm_invitations,
  public.audit_log, public.doc_counters from authenticated;
revoke update, delete on public.audit_log from authenticated;
-- Only these farm columns are editable directly; settings changes go through owner screens.
revoke update on public.farms from authenticated;
grant update (name, address, phone, logo_path, timezone, language, settings) on public.farms to authenticated;
revoke update on public.farm_memberships from authenticated;
grant update (role, active) on public.farm_memberships to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- app functions are internal; only the policy helpers are callable by signed-in users.
alter default privileges in schema app revoke execute on functions from public;
revoke execute on all functions in schema app from public;
grant execute on function app.has_farm_role(uuid, public.farm_role[]) to authenticated;
grant execute on function app.is_farm_member(uuid) to authenticated;
grant execute on function app.assert_farm_role(uuid, public.farm_role[]) to authenticated;
grant execute on function app.can_view_profile(uuid) to authenticated;
