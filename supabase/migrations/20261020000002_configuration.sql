-- Farm configuration: units, conversions, animal types, breeds, locations, sessions,
-- payment methods and money categories. Readable by every member, editable by owners.

create table public.units (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  code       text not null check (length(btrim(code)) between 1 and 16),
  name       text not null check (length(btrim(name)) between 1 and 60),
  kind       text not null check (kind in ('volume', 'mass', 'count', 'animal', 'other')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz,
  updated_by uuid,
  unique (farm_id, code)
);

-- 1 from_unit = factor × to_unit (e.g. 1 tray = 30 piece). Farms review and edit these.
create table public.unit_conversions (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references public.farms (id) on delete cascade,
  from_unit_id uuid not null references public.units (id),
  to_unit_id   uuid not null references public.units (id),
  factor       numeric(18, 6) not null check (factor > 0),
  created_at   timestamptz not null default now(),
  created_by   uuid default auth.uid(),
  updated_at   timestamptz,
  updated_by   uuid,
  unique (farm_id, from_unit_id, to_unit_id),
  check (from_unit_id <> to_unit_id)
);

create table public.animal_types (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  name          text not null check (length(btrim(name)) between 1 and 60),
  tracking_mode text not null check (tracking_mode in ('individual', 'batch')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid default auth.uid(),
  updated_at    timestamptz,
  updated_by    uuid
);
create unique index animal_types_name_uq on public.animal_types (farm_id, lower(name));

create table public.breeds (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references public.farms (id) on delete cascade,
  animal_type_id uuid not null references public.animal_types (id),
  name           text not null check (length(btrim(name)) between 1 and 60),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  created_by     uuid default auth.uid(),
  updated_at     timestamptz,
  updated_by     uuid
);
create unique index breeds_name_uq on public.breeds (farm_id, animal_type_id, lower(name));

create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 60),
  kind       text not null default 'shed' check (kind in ('shed', 'group', 'pen', 'other')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz,
  updated_by uuid
);
create unique index locations_name_uq on public.locations (farm_id, lower(name));

create table public.production_sessions (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 40),
  sort_order int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz,
  updated_by uuid
);
create unique index production_sessions_name_uq on public.production_sessions (farm_id, lower(name));

create table public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 40),
  kind       text not null check (kind in ('cash', 'bank', 'cheque', 'wallet', 'other')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz,
  updated_by uuid
);
create unique index payment_methods_name_uq on public.payment_methods (farm_id, lower(name));

create table public.money_categories (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references public.farms (id) on delete cascade,
  kind       text not null check (kind in ('expense', 'income')),
  name       text not null check (length(btrim(name)) between 1 and 60),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz,
  updated_by uuid
);
create unique index money_categories_name_uq on public.money_categories (farm_id, kind, lower(name));

-- Same-farm guard for references between configuration rows.
create function app.check_same_farm()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'unit_conversions' then
    if exists (select 1 from public.units where id in (new.from_unit_id, new.to_unit_id) and farm_id <> new.farm_id) then
      raise exception 'unit belongs to another farm' using errcode = '42501';
    end if;
  elsif tg_table_name = 'breeds' then
    if exists (select 1 from public.animal_types where id = new.animal_type_id and farm_id <> new.farm_id) then
      raise exception 'animal type belongs to another farm' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger unit_conversions_same_farm before insert or update on public.unit_conversions
  for each row execute function app.check_same_farm();
create trigger breeds_same_farm before insert or update on public.breeds
  for each row execute function app.check_same_farm();

-- Shared triggers and policies for every configuration table.
do $$
declare
  t text;
begin
  foreach t in array array['units', 'unit_conversions', 'animal_types', 'breeds', 'locations',
                           'production_sessions', 'payment_methods', 'money_categories'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger %I before update on public.%I for each row execute function app.touch_row()', t || '_touch', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function app.audit_row()', t || '_audit', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select app.is_farm_member(farm_id)))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select app.has_farm_role(farm_id, ''{owner}'')))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select app.has_farm_role(farm_id, ''{owner}''))) with check ((select app.has_farm_role(farm_id, ''{owner}'')))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select app.has_farm_role(farm_id, ''{owner}'')))', t || '_delete', t);
    execute format('create index %I on public.%I (farm_id)', t || '_farm_idx', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;
