-- RPCs for farm onboarding and team invitations.

-- Creates a farm, makes the caller its owner and seeds configuration for the farm type.
-- Idempotent per (caller, client_request_id): a repeated submit returns the same farm.
create function public.create_farm_with_template(
  p_name              text,
  p_category          public.farm_category,
  p_timezone          text default 'Asia/Karachi',
  p_client_request_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_farm uuid;
  v_unit jsonb;
  v_name text;
  v_i    int := 0;
begin
  if v_uid is null then
    raise exception 'sign in required' using errcode = '42501';
  end if;

  if p_client_request_id is not null then
    select id into v_farm from public.farms
    where created_by = v_uid and client_request_id = p_client_request_id;
    if found then
      return v_farm;
    end if;
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'unknown timezone: %', p_timezone using errcode = '22023';
  end if;

  insert into public.farms (name, category, timezone, settings, client_request_id, created_by)
  values (
    btrim(p_name),
    p_category,
    p_timezone,
    jsonb_build_object(
      'milk_mode', 'per_animal',
      'allow_negative_stock', false,
      'payroll_period', 'monthly',
      'monthly_salary_uses_attendance', false,
      'conversions_reviewed', false
    ),
    p_client_request_id,
    v_uid
  )
  returning id into v_farm;

  insert into public.farm_memberships (farm_id, user_id, role, created_by)
  values (v_farm, v_uid, 'owner', v_uid);

  -- Units. Local measures vary by area, so the onboarding screen asks the owner to review conversions.
  for v_unit in select * from jsonb_array_elements('[
    {"code":"L","name":"Litre","kind":"volume"},
    {"code":"ml","name":"Millilitre","kind":"volume"},
    {"code":"kg","name":"Kilogram","kind":"mass"},
    {"code":"g","name":"Gram","kind":"mass"},
    {"code":"maund","name":"Maund","kind":"mass"},
    {"code":"pc","name":"Piece","kind":"count"},
    {"code":"dozen","name":"Dozen","kind":"count"},
    {"code":"tray","name":"Tray","kind":"count"},
    {"code":"crate","name":"Crate","kind":"count"},
    {"code":"bag","name":"Bag","kind":"count"},
    {"code":"bale","name":"Bale","kind":"count"},
    {"code":"head","name":"Head (animal)","kind":"animal"}
  ]'::jsonb) loop
    insert into public.units (farm_id, code, name, kind, created_by)
    values (v_farm, v_unit ->> 'code', v_unit ->> 'name', v_unit ->> 'kind', v_uid);
  end loop;

  insert into public.unit_conversions (farm_id, from_unit_id, to_unit_id, factor, created_by)
  select v_farm, f.id, t.id, c.factor, v_uid
  from (values ('L', 'ml', 1000), ('kg', 'g', 1000), ('maund', 'kg', 40),
               ('dozen', 'pc', 12), ('tray', 'pc', 30)) as c (from_code, to_code, factor)
  join public.units f on f.farm_id = v_farm and f.code = c.from_code
  join public.units t on t.farm_id = v_farm and t.code = c.to_code;

  -- Animal types by farm category.
  insert into public.animal_types (farm_id, name, tracking_mode, created_by)
  select v_farm, a.name, a.mode, v_uid
  from (values
    ('dairy', 'Cow', 'individual'), ('dairy', 'Buffalo', 'individual'),
    ('livestock', 'Cattle', 'individual'), ('livestock', 'Goat', 'individual'), ('livestock', 'Sheep', 'individual'),
    ('poultry', 'Layer hens', 'batch'), ('poultry', 'Broilers', 'batch'),
    ('mixed', 'Cow', 'individual'), ('mixed', 'Buffalo', 'individual'), ('mixed', 'Goat', 'individual'),
    ('mixed', 'Layer hens', 'batch')
  ) as a (category, name, mode)
  where a.category = p_category::text;

  -- Production sessions.
  foreach v_name in array case p_category
      when 'dairy' then array['Morning', 'Evening']
      when 'mixed' then array['Morning', 'Evening']
      when 'poultry' then array['Morning', 'Afternoon']
      else array['Daily']
    end loop
    v_i := v_i + 1;
    insert into public.production_sessions (farm_id, name, sort_order, created_by)
    values (v_farm, v_name, v_i, v_uid);
  end loop;

  insert into public.locations (farm_id, name, kind, created_by)
  values (v_farm, 'Main shed', 'shed', v_uid);

  insert into public.payment_methods (farm_id, name, kind, created_by)
  values (v_farm, 'Cash', 'cash', v_uid),
         (v_farm, 'Bank transfer', 'bank', v_uid),
         (v_farm, 'Cheque', 'cheque', v_uid),
         (v_farm, 'Mobile wallet', 'wallet', v_uid);

  insert into public.money_categories (farm_id, kind, name, created_by)
  select v_farm, c.kind, c.name, v_uid
  from (values
    ('expense', 'Utilities'), ('expense', 'Fuel'), ('expense', 'Transport'), ('expense', 'Repairs'),
    ('expense', 'Rent'), ('expense', 'Veterinary'), ('expense', 'Supplies'), ('expense', 'Other'),
    ('income', 'By-product sales'), ('income', 'Other income')
  ) as c (kind, name);

  return v_farm;
end;
$$;

-- Creates an invitation and returns the one-time token. Only its hash is stored.
create function public.create_invitation(p_farm uuid, p_email text, p_role public.farm_role)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  perform app.assert_farm_role(p_farm, '{owner}');

  insert into public.farm_invitations (farm_id, email, role, token_hash)
  values (p_farm, lower(btrim(p_email)), p_role, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'));

  return v_token;
end;
$$;

-- Lets the invite page show which farm and role an invitation is for before accepting.
create function public.get_invitation(p_token text)
returns table (farm_name text, role public.farm_role, email text, expired boolean, accepted boolean)
language sql stable security definer set search_path = ''
as $$
  select f.name, i.role, i.email, i.expires_at < now(), i.accepted_at is not null
  from public.farm_invitations i
  join public.farms f on f.id = i.farm_id
  where i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and auth.uid() is not null;
$$;

-- Accepts an invitation addressed to the signed-in user's email.
create function public.accept_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_inv public.farm_invitations;
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '42501';
  end if;

  select * into v_inv from public.farm_invitations
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  for update;

  if not found or v_inv.accepted_at is not null or v_inv.expires_at < now() then
    raise exception 'invitation is invalid, expired or already used' using errcode = 'P0001';
  end if;
  if v_inv.email <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'this invitation was sent to a different email address' using errcode = '42501';
  end if;

  insert into public.farm_memberships (farm_id, user_id, role, created_by)
  values (v_inv.farm_id, auth.uid(), v_inv.role, v_inv.created_by)
  on conflict (farm_id, user_id) do update set role = excluded.role, active = true;

  update public.farm_invitations
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_inv.id;

  return v_inv.farm_id;
end;
$$;

revoke execute on function public.create_farm_with_template(text, public.farm_category, text, uuid) from public, anon;
revoke execute on function public.create_invitation(uuid, text, public.farm_role) from public, anon;
revoke execute on function public.get_invitation(text) from public, anon;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.create_farm_with_template(text, public.farm_category, text, uuid) to authenticated;
grant execute on function public.create_invitation(uuid, text, public.farm_role) to authenticated;
grant execute on function public.get_invitation(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
