# Permissions matrix

The database enforces these rules through Row Level Security (RLS) and role checks inside RPC functions.
The app menu (`src/app/nav.ts`) only hides what a role cannot use; it is not a security boundary.

Each cell must be backed by a test in `supabase/tests/`. ✅ = full access, R = read only, — = no access.

| Area | Owner | Manager | Accountant | Worker | Status |
|---|---|---|---|---|---|
| Farm profile and settings | ✅ | R (via membership) | R (via membership) | R (via membership) | Built (Phase 1) |
| Units, conversions, lists | ✅ | R | R | R | Built (Phase 1) |
| Team: memberships | ✅ | R (whole team) | own row | own row | Built (Phase 1) |
| Team: invitations | ✅ | — | — | — | Built (Phase 1) |
| Profiles (name, email, phone) | team | team | own | own | Built (Phase 1) |
| Audit log | R | — | — | — | Built (Phase 1) |
| Livestock, production | ✅ | ✅ | R | production entry only | Phase 2a |
| Sales, purchases, payments | ✅ | ✅ | ✅ | — | Phase 2b/2c |
| Inventory movements | ✅ | ✅ | R | consumption (if enabled) | Phase 3 |
| Money register, P&L | ✅ | ops reports only | ✅ | — | Phase 3 |
| Employees (rates, contacts), payroll | ✅ | attendance only | ✅ | — | Phase 4 |

## Rules shared by every table

- Every tenant row carries `farm_id`. Policies call `app.has_farm_role(farm_id, roles)`.
- `farm_id` cannot be changed after insert (`app.touch_row` trigger).
- Anonymous users have no table privileges.
- A farm always keeps at least one active owner (`app.protect_last_owner` trigger).
- A CI test fails if any table in `public` has RLS disabled.
