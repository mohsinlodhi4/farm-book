-- Farm isolation and role checks for the Phase 1 foundation.
-- Users: alice owns Farm A, bob owns Farm B, walt is invited to Farm A as a worker.
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', 'authenticated', 'authenticated', '{"full_name":"Alice Owner"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test',   'authenticated', 'authenticated', '{"full_name":"Bob Owner"}'),
  ('33333333-3333-3333-3333-333333333333', 'walt@example.test',  'authenticated', 'authenticated', '{"full_name":"Walt Worker"}');

select is((select count(*)::int from public.profiles), 3, 'a profile is created for each new user');

-- ---- alice creates Farm A ----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","email":"alice@example.test"}', true);
select set_config('test.farm_a', public.create_farm_with_template('Farm A', 'dairy', 'Asia/Karachi', 'aaaaaaaa-0000-0000-0000-000000000001')::text, true);

select is(
  public.create_farm_with_template('Farm A', 'dairy', 'Asia/Karachi', 'aaaaaaaa-0000-0000-0000-000000000001')::text,
  current_setting('test.farm_a'),
  'repeating create_farm_with_template with the same request id returns the same farm'
);
select is((select count(*)::int from public.farms), 1, 'alice sees exactly one farm');
select is((select count(*)::int from public.units where farm_id = current_setting('test.farm_a')::uuid), 12, 'template seeds 12 units');
select is(
  (select array_agg(name order by sort_order) from public.production_sessions where farm_id = current_setting('test.farm_a')::uuid),
  array['Morning', 'Evening'],
  'dairy template seeds Morning and Evening sessions'
);
select is(
  (select c.factor from public.unit_conversions c join public.units u on u.id = c.from_unit_id where u.farm_id = current_setting('test.farm_a')::uuid and u.code = 'tray'),
  30.000000::numeric,
  'template seeds 1 tray = 30 pieces'
);
select set_config('test.invite_token', public.create_invitation(current_setting('test.farm_a')::uuid, 'Walt@Example.test', 'worker'), true);

-- ---- bob creates Farm B ------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","email":"bob@example.test"}', true);
select set_config('test.farm_b', public.create_farm_with_template('Farm B', 'poultry')::text, true);

select is((select count(*)::int from public.farms), 1, 'bob sees only his own farm');
select is((select count(*)::int from public.units where farm_id = current_setting('test.farm_a')::uuid), 0, 'bob cannot read Farm A units');
select is((select count(*)::int from public.audit_log where farm_id = current_setting('test.farm_a')::uuid), 0, 'bob cannot read Farm A audit log');
select results_eq(
  $$ with u as (update public.farms set name = 'Hacked' where id = current_setting('test.farm_a')::uuid returning 1) select count(*)::int from u $$,
  $$ values (0) $$,
  'bob cannot rename Farm A'
);
select throws_ok(
  $$ insert into public.units (farm_id, code, name, kind) values (current_setting('test.farm_a')::uuid, 'x', 'X', 'count') $$,
  '42501', null,
  'bob cannot insert units into Farm A'
);
select throws_ok(
  $$ select public.create_invitation(current_setting('test.farm_a')::uuid, 'bob2@example.test', 'owner') $$,
  '42501', null,
  'bob cannot invite people to Farm A'
);
select throws_ok(
  $$ select public.accept_invitation(current_setting('test.invite_token')) $$,
  '42501', null,
  'an invitation cannot be accepted by a different email address'
);
select throws_ok(
  $$ update public.units set farm_id = current_setting('test.farm_a')::uuid where farm_id = current_setting('test.farm_b')::uuid $$,
  '42501', null,
  'a row cannot be moved to another farm'
);

-- ---- walt accepts the worker invitation ------------------------------------
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated","email":"walt@example.test"}', true);
select is((select role::text from public.get_invitation(current_setting('test.invite_token'))), 'worker', 'invitee can preview the invitation');
select is(public.accept_invitation(current_setting('test.invite_token'))::text, current_setting('test.farm_a'), 'walt joins Farm A');
select throws_ok(
  $$ select public.accept_invitation(current_setting('test.invite_token')) $$,
  'P0001', null,
  'an invitation can be used only once'
);
select is((select count(*)::int from public.units where farm_id = current_setting('test.farm_a')::uuid), 12, 'worker can read farm configuration');
select throws_ok(
  $$ insert into public.locations (farm_id, name) values (current_setting('test.farm_a')::uuid, 'Shed 2') $$,
  '42501', null,
  'worker cannot change farm configuration'
);
select is((select count(*)::int from public.audit_log), 0, 'worker cannot read the audit log');
select is((select count(*)::int from public.farm_memberships), 1, 'worker sees only their own membership');
select is((select count(*)::int from public.profiles), 1, 'worker sees only their own profile, not co-workers'' contact details');

-- ---- alice: owner protections ----------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","email":"alice@example.test"}', true);
select is((select count(*)::int from public.farm_memberships where farm_id = current_setting('test.farm_a')::uuid), 2, 'owner sees the whole team');
select is((select email from public.profiles where user_id = '33333333-3333-3333-3333-333333333333'), 'walt@example.test', 'owner can see team member profiles');
select throws_ok(
  $$ update public.farm_memberships set role = 'manager' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001', null,
  'the last owner cannot be demoted'
);

-- ---- anonymous and schema-wide checks --------------------------------------
reset role;
select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'every public table has RLS enabled'
);

select * from finish();
rollback;
