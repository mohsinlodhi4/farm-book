# Farm Management SaaS — Implementation Plan

**Stack:** React + TypeScript + Vite (frontend) · Supabase (Postgres, Auth, Storage, Edge Functions)
**Deployment target:** $0/month for development and pilot
**Source of requirements:** [farm_management_system_prd.md](farm_management_system_prd.md)
**Repository state at planning time:** empty (PRD only)

---

## 1. Key architecture decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Business logic lives in Postgres** (plpgsql RPC functions) and the frontend calls them through `supabase.rpc()` | Confirming a sale or purchase touches several tables (lines, stock movements, animal events, payments). A Postgres function runs as one transaction, which meets the PRD's "database transactions for multi-record changes" requirement without a separate API server. |
| 2 | **Row Level Security (RLS) on every table**, keyed on `farm_id` + role from `farm_memberships` | Supabase exposes tables directly to the browser, so RLS is the authorization layer. This is how "Farm A cannot read Farm B by changing IDs" is enforced. |
| 3 | **Append-only ledgers; balances are computed, never stored** | `stock_movements`, `animal_events`, `customer_payments`/`payment_allocations`, and `supplier_payments` are the source of truth. Balances come from views (or materialized views if needed later). This meets "reconcilable from movements" and "dashboard totals derived from source records". |
| 4 | **Confirmed documents are immutable** — corrections go through `reverse_*` RPCs that write compensating rows | A trigger blocks UPDATE/DELETE on confirmed rows. This meets "reversals create compensating movements". |
| 5 | **Idempotency key on every transaction RPC** | The client generates a `client_request_id` (UUID) when a form opens. A `unique (farm_id, client_request_id)` constraint turns a double submit into a no-op that returns the existing record. |
| 6 | **Fixed-precision numbers everywhere** | Money is `numeric(14,2)`, quantities `numeric(14,3)`, conversion factors `numeric(18,6)`. The frontend uses `decimal.js` only for live form previews; the server recalculates and is the authority. |
| 7 | **Store the entered quantity/unit plus a normalized base quantity** | Columns `qty_entered`, `unit_id_entered`, `qty_base`, using per-farm `unit_conversions`, as the PRD asks. |
| 8 | **Business date ≠ timestamp** | Each record has `entry_date date` (a farm-local business day) plus `created_at timestamptz`. The farm timezone defaults to `Asia/Karachi`. |
| 9 | **Server-side tests for the rules that matter** | pgTAP (`supabase test db`) covers RLS isolation, calculations, reversals, and idempotency. Vitest covers frontend helpers. Playwright covers mobile-viewport workflows. |
| 10 | **No separate backend service** | Edge Functions are used only where Postgres can't do the job: sending invitation emails, scheduled alert digests, and generating backups. |

---

## 2. Free-tier deployment plan

> Free-tier limits change. Check each provider's current pricing page before you rely on these numbers.

| Concern | Service (free tier) | Notes / limits to watch |
|---|---|---|
| Frontend hosting | **Cloudflare Pages** | Free tier allows commercial use, gives unlimited bandwidth, and creates preview deploys per PR. Avoid **Vercel Hobby** for this: its terms are non-commercial, and a SaaS is commercial. Netlify free is an acceptable alternative. |
| Database, Auth, Storage | **Supabase Free** | About 500 MB database, 1 GB storage, 5 GB egress, 50k monthly active users, **2 free projects** (use them as `staging` + `prod`). **The project pauses after ~7 days of inactivity**, and the free tier has **no automated backups or PITR**. |
| Keep-alive + backups | **GitHub Actions** (scheduled workflow) | A nightly `pg_dump` (via `supabase db dump`) is encrypted and uploaded. The same job also keeps the project from pausing. |
| Backup storage | **Cloudflare R2** (10 GB free) or a private GitHub repo/release artifacts | Keep 30 daily and 12 monthly dumps. Document and test the restore (a PRD acceptance criterion). |
| Transactional email | **Resend** or **Brevo** free tier, set as Supabase's custom SMTP | Supabase's built-in SMTP is limited to a few emails per hour, which isn't enough for signups and invitations. |
| Error monitoring | **Sentry** free (Developer) plan | Scrub PII in `beforeSend`, and don't send form payloads. |
| CI/CD | **GitHub Actions** | Runs lint, typecheck, unit tests, and DB tests, then `supabase db push` to staging on merge and to prod on tag. Cloudflare deploys the frontend from Git. |
| Domain | `*.pages.dev` subdomain (free) | A custom domain costs about $10/year (optional). |

**Capacity estimate:** a 50-cow dairy farm logging milk twice a day writes about 36k production rows a year. With everything else included, that's a few MB per farm per year. 500 MB should hold **dozens of pilot farms** for the first year. Upgrade to Supabase Pro (daily backups, no pausing) once you have paying customers.

**Auth choice:** email + password, with magic link as an option. Phone/SMS OTP isn't free. You can add WhatsApp/SMS later.

---

## 3. Repository layout

A single repo, not a monorepo. That keeps it simple for a small team.

```
farm-management/
├─ src/
│  ├─ app/                 # router, providers, layout shell, auth guard
│  ├─ features/            # one folder per module (vertical slices)
│  │  ├─ auth/  onboarding/  settings/  livestock/  production/
│  │  ├─ sales/ customers/   purchases/ suppliers/  inventory/
│  │  ├─ money/ employees/   payroll/   dashboard/  reports/
│  │  └─ <feature>/{api.ts, hooks.ts, schemas.ts, components/, pages/}
│  ├─ components/ui/       # shadcn/ui primitives
│  ├─ lib/                 # supabase client, decimal/format helpers, i18n, csv, print
│  ├─ types/database.ts    # generated by `supabase gen types typescript`
│  └─ main.tsx
├─ supabase/
│  ├─ migrations/          # timestamped SQL; the only way the schema changes
│  ├─ tests/               # pgTAP: rls_*.sql, calc_*.sql, rpc_*.sql
│  ├─ functions/           # edge functions (invite-email, alerts-digest)
│  ├─ seed.sql             # synthetic demo farms (dairy + poultry); no real data
│  └─ config.toml
├─ e2e/                    # Playwright, mobile viewport
├─ .github/workflows/      # ci.yml, deploy-db.yml, backup.yml
└─ docs/                   # restore runbook, permissions matrix, calculation rules
```

### Frontend libraries

| Need | Library |
|---|---|
| Routing | React Router (route-level code-splitting so low-end Android phones download less) |
| Server state | TanStack Query (caching, retries, invalidation after mutations) |
| Forms + validation | react-hook-form + zod. The same zod schemas validate on the client; Postgres constraints and RPC checks validate on the server. |
| UI | Tailwind CSS + shadcn/ui (accessible, lightweight, mobile-friendly) |
| Decimal math / formatting | decimal.js, `Intl.NumberFormat('en-PK', { currency: 'PKR' })` |
| Dates | date-fns + date-fns-tz |
| Charts | Recharts (dashboard only, lazy-loaded) |
| CSV | papaparse (import + export) |
| PDF / print | Print-optimized CSS pages (`@media print`) first. `@react-pdf/renderer` for invoices/payroll slips only if browser print isn't good enough. |
| i18n | i18next, set up from day one so Urdu (RTL) can be added later without refactoring |
| PWA | vite-plugin-pwa for **installability and app-shell caching only**. No offline data writes (the PRD says not to claim offline support yet). |

**Local development on Windows:** the Supabase CLI local stack (`supabase start`) needs Docker Desktop. Without Docker, develop against the free `staging` project. You can't run `supabase test db` locally that way, so DB tests run in CI only.

---

## 4. Database design

### 4.1 Conventions (every tenant table)

```sql
id          uuid primary key default gen_random_uuid(),
farm_id     uuid not null references farms(id),
created_at  timestamptz not null default now(),
created_by  uuid references auth.users(id) default auth.uid(),
updated_at  timestamptz,
updated_by  uuid,
notes       text
-- plus `status` and `client_request_id uuid` on transactional documents
```

- Indexes: `(farm_id, entry_date)` on every dated table, and `(farm_id, <fk>)` on foreign keys.
- A generic `audit_trigger()` writes old/new `jsonb` to `audit_log` for sensitive tables (documents, payments, employees, settings, memberships).
- `doc_counters (farm_id, doc_type, next_no)` uses a row lock inside `next_doc_number()` → `SAL-2026-00042`.

### 4.2 Tables by module

**Tenancy & access**
- `farms` — name, address, phone, logo_path, timezone, currency, language, category (`dairy|livestock|poultry|mixed|other`), settings jsonb (milk mode `per_animal|bulk`, allow_negative_stock, payroll period, monthly-salary-attendance rule)
- `farm_memberships` — farm_id, user_id, role (`owner|manager|worker|accountant`), active
- `farm_invitations` — farm_id, email, role, token_hash, expires_at, accepted_at
- `profiles` — user_id, full_name, phone
- `audit_log` — farm_id, table_name, record_id, action, old_data, new_data, actor, at

**Configuration**
- `units` (farm-scoped, seeded from a template), `unit_conversions` (from_unit, to_unit, factor)
- `animal_types` (species, tracking_mode `individual|batch`), `breeds`, `locations` (shed/group), `animal_statuses`
- `product_categories`, `products` (unit, sale_unit, default_rate, track_production, track_stock, active)
- `payment_methods`, `production_sessions`, `expense_categories`, `income_categories`

**Livestock**
- `animals` — tag (unique per farm, partial index where not archived), animal_type, breed, sex, dob/est_age, purpose, location, status, acquisition_cost, photo_path
- `animal_batches` — code, type, strain, source, arrival_date, initial_count, stage, location
- `animal_events` — event_type (`purchase|birth|sale|death|transfer_in|transfer_out|adjustment|status_change`), animal_id or batch_id, count_delta, reason, source_doc (sale_line / purchase_line), reversal_of
- View `v_batch_counts` = initial_count + Σ count_delta; view `v_livestock_summary` grouped by type/status

**Production**
- `production_entries` — entry_date, session_id, product_id, animal_id/batch_id (nullable), qty_entered/unit/qty_base, qty_rejected, egg fields (good/broken/rejected), reversal_of
- Constraint enforcing the farm's milk mode, so per-animal entries and a bulk total are never both counted as production
- If the product tracks stock, saving production writes a `stock_movements` row (`production_in`)

**Parties**
- `customers`, `suppliers` — name, phone, address, opening_balance, opening_balance_date, active

**Sales**
- `sales` — doc_no, sale_date, customer_id, status (`draft|confirmed|cancelled`), charges, invoice_discount, due_date, client_request_id
- `sale_lines` — product_id or animal_id/batch_id (live sale), qty, unit, rate, line_discount, line_total (generated)
- `customer_payments` — date, customer, amount, method, reference, client_request_id
- `payment_allocations` — payment_id, sale_id, amount (check: Σ allocated ≤ payment and ≤ invoice balance)
- Views `v_sale_balances` (total, allocated, outstanding, derived paid/partial/unpaid) and `v_customer_ledger` / `v_customer_balances`
- "Paid" status is **derived from allocations**, never stored (PRD §6 rule)

**Purchases**
- `purchases`, `purchase_lines` (line kind `stock_item|animal|batch|expense`), `supplier_payments`, `supplier_payment_allocations`
- Views `v_purchase_balances`, `v_supplier_ledger`, `v_supplier_balances`

**Inventory**
- `inventory_items` — category, base_unit, reorder_level, costing (`weighted_avg`), track_lots
- `stock_lots` (optional) — lot_no, expiry_date
- `stock_movements` — item_id or product_id, movement_type (`purchase_in|production_in|sale_out|consumption|wastage|expiry|return_in|return_out|transfer|adjustment|opening`), qty_base (signed), unit_cost, destination (location/batch/animal), source_table/source_id, reversal_of, override_negative bool
- Views `v_stock_on_hand`, `v_stock_value` (weighted average), `v_low_stock`, `v_near_expiry`
- Trigger rejects negative on-hand unless the farm setting allows it **and** `override_negative = true` (audited)

**Money**
- `money_entries` — kind (`expense|income`), category, amount, method, counterparty, entry_date, link (source_table/source_id), attachment_path
- Rule for no double counting: inventory purchases are **not** expenses. Expense is recognized on `consumption` movements (qty × avg cost) and on purchase lines of kind `expense`. Payroll is recognized when a payroll run is finalized.

**Employees & payroll**
- `employees` — code, name, phone, job, start_date, wage_method (`daily|monthly|hourly|piece`), base_rate, active, emergency_contact (owner/accountant only)
- `attendance_entries` — unique (employee_id, date); status `present|absent|half|leave`, hours, overtime_hours
- `employee_advances`, `advance_repayments` (linked to payroll_line)
- `payroll_runs` (period, status `draft|finalized|reversed`), `payroll_lines` (gross, overtime, bonus, deductions, advance_recovery, net, formula_snapshot jsonb), `payroll_payments`
- Check: advance recovery ≤ outstanding advance balance

**Alerts**
- Computed views (`v_alerts`: low stock, overdue invoices, missing milk entries, near expiry) + `alert_dismissals (farm_id, alert_key, user_id, until)`. No stored alert rows to drift out of sync.

### 4.3 Key RPC functions (each one transaction, each idempotent)

| Function | Effect |
|---|---|
| `create_farm_with_template(name, category, …)` | Creates farm + owner membership + seeded units/conversions/sessions/categories/products for the chosen farm type |
| `confirm_sale(sale_id, client_request_id, initial_payment?)` | Locks the sale, validates stock, writes `sale_out` movements and `animal_events` for live-animal lines, optionally writes payment + allocation |
| `reverse_sale(sale_id, reason)` | Writes compensating movements/events, voids allocations (moves payment to unallocated credit), sets status `cancelled` |
| `record_customer_payment(customer_id, amount, method, allocations[], client_request_id)` | Payment + allocations; auto-allocates oldest-first if none are given |
| `confirm_purchase` / `reverse_purchase` | Stock in, creates animals or batch events for animal lines, sets acquisition cost |
| `record_supplier_payment(...)` | As for customers |
| `record_production_bulk(date, session, rows[], client_request_id)` | Quick-entry table save; writes stock movements if tracked |
| `record_stock_movement(...)` / `stock_count_adjust(item, counted_qty, reason)` | Consumption, wastage, adjustments |
| `record_animal_event(...)` | Death/mortality, transfer, adjustment with reason |
| `calculate_payroll(run_id)` → `finalize_payroll(run_id)` → `reverse_payroll(run_id)` | Draft calculation with formula snapshot, lock, compensating reversal |
| `record_attendance_bulk(date, rows[])` | Upsert per employee/date (allowed while the period isn't finalized) |

RPCs are `security definer` with `set search_path = ''`. **Every one starts with `perform assert_farm_role(p_farm_id, array[...])`**, so they can't be used to step around RLS.

### 4.4 RLS & permissions

Helper functions (`security definer`, `stable`), wrapped in `(select …)` inside policies so they're evaluated once per query:

```sql
create function app.has_farm_role(p_farm uuid, p_roles app.role[]) returns boolean ...
-- policy example
create policy sales_select on sales for select
  using ((select app.has_farm_role(farm_id, '{owner,manager,accountant}')));
```

| Area | Owner | Manager | Accountant | Worker |
|---|---|---|---|---|
| Settings, users, corrections/reversals | ✅ | — | — | — |
| Livestock, production | ✅ | ✅ | read | production entry only |
| Sales/purchases/payments | ✅ | ✅ | ✅ | — |
| Inventory movements | ✅ | ✅ | read | consumption entry (optional per farm) |
| Money, P&L, reports with financials | ✅ | ops reports only | ✅ | — |
| Employees (rates, contacts), payroll | ✅ | attendance only | ✅ | — |
| Attendance | ✅ | ✅ | read | — (or own, later) |

Workers see employee names (for attendance) through an RPC/view that exposes only `id, name`. They never get direct `select` on `employees`. Purchase prices on animals live in event/purchase tables that workers can't read.

Write this matrix as `docs/permissions.md` and back **every cell** with a pgTAP test.

---

## 5. Phased delivery

Durations assume one full-time developer and are rough.

### Phase 0 — Project setup (≈3–4 days)
- `npm create vite@latest` (react-ts), Tailwind, shadcn/ui, ESLint + Prettier, Vitest, Playwright.
- `supabase init`; link `staging` and `prod` projects; type generation script (`npm run db:types`).
- GitHub repo + Actions: `ci.yml` (lint, `tsc --noEmit`, vitest, `supabase test db`), Cloudflare Pages connected with PR previews.
- Configure Resend SMTP in Supabase Auth; Sentry DSN.
- **Done when:** a "hello" page is deployed to `*.pages.dev`, signed in against staging Supabase, and CI is green.

### Phase 1 — Foundation: tenancy, auth, settings (≈2 weeks)
- Migrations: `farms`, `farm_memberships`, `farm_invitations`, `profiles`, `audit_log`, `doc_counters`, role enum, `app.has_farm_role`, `assert_farm_role`, audit trigger, immutability trigger template.
- Auth pages (sign up, sign in, reset), onboarding wizard → `create_farm_with_template` (dairy / poultry / livestock / mixed presets).
- Farm switcher (a user can belong to multiple farms), invitations + accept flow (Edge Function sends email).
- App shell: mobile bottom nav + desktop sidebar, toast/error boundary, loading/empty states, form patterns that keep input on errors.
- Settings screens: units + conversions, animal types/breeds/locations/statuses, sessions, payment methods, categories, farm preferences.
- **Tests:** pgTAP RLS isolation suite (two farms, four roles, every table: select/insert/update/delete blocked across farms). This suite grows with every phase.
- **Done when:** an owner signs up, creates a dairy farm, invites a worker, and the worker only sees permitted screens. Cross-farm tests pass.

### Phase 2a — Livestock + products + production (≈2 weeks)
- Animals (individual) and batches (flock) CRUD, `animal_events`, timeline view, archive, duplicate-tag constraint, search/filter, paginated lists.
- Mortality / transfer / adjustment forms (reason required).
- Product catalog.
- "Today's Production" quick-entry table (per-animal or bulk mode, AM/PM columns, running totals, compare with yesterday and 7-day average, missing-entry flags). Egg entry with good/broken/rejected and tray conversion.
- CSV import for animals/batches (preview → validate → commit via RPC).
- **Tests:** animal count = Σ events; per-animal vs bulk mode can't double count; production → stock movement.

### Phase 2b — Customers, sales, receipts (≈2 weeks)
- Customers with opening balance; sale form (draft → confirm with confirmation dialog), line calc preview, initial payment.
- Receive payment with allocation across invoices; customer ledger/statement; outstanding & overdue list.
- Live-animal sale lines write animal events.
- Printable invoice/receipt (print CSS).
- **Tests:** all PRD §7 rules 1–4; partial payments; one payment across many invoices; double-submit returns the same sale; reversal restores stock and balance.

### Phase 2c — Suppliers & purchases (≈1.5 weeks)
- Purchases with line kinds (stock item / animal / batch / immediate expense), transport/other charges, receipt photo upload to Storage (private bucket, farm-scoped path + storage RLS).
- Supplier payments, allocations, supplier ledger.
- Workflow A (buy a cow) end-to-end.
- **Tests:** rule 5; feed purchase → stock, not expense; animal purchase creates animal with acquisition cost.

### Phase 3 — Inventory & money (≈2 weeks)
- Inventory items, stock on hand, movement ledger, consumption/issue (destination shed/batch), wastage/expiry/return, physical count adjustment, weighted-average cost, optional lots/expiry.
- Negative-stock guard + owner override (audited).
- Money register (expenses/income), categories, attachments.
- Estimated operating summary: income (confirmed sales + other income) − expenses (consumption cost + expense lines + money expenses + finalized payroll), shown with a **"How this was calculated"** drill-down. Cash-movement report kept separate (rule 11). The labels say "Estimated operating summary", not "Profit".
- **Tests:** rule 7 reconstruction; workflow C; no double counting across purchase → consumption.

### Phase 4 — Employees & payroll (≈1.5 weeks)
- Employee register (sensitive fields restricted), bulk attendance grid for a date, advances.
- Payroll run: select period/employees → calculate (formula shown per line: e.g. `26 days × 1,200 + 4 OT h × 200 − 5,000 advance`) → review → finalize (lock) → record payments → print payroll sheet/slips.
- Monthly salary ignores attendance unless the farm rule is on.
- **Tests:** rules 9–10 for each wage method; recovery can't exceed advance balance; finalized run immutable; reversal.

### Phase 5 — Dashboard, reports, polish, pilot (≈2–3 weeks)
- Dashboard tiles + quick actions (PRD §4.10/§9); alerts with dismiss; daily closing summary (workflow E) where every number links to its source records.
- The 12 MVP reports, all with shared filter bar (date range, location, type, status), CSV export, and print/PDF that shows date range, currency, and units.
- Performance pass: route splitting, list pagination, Lighthouse on a throttled mid-range Android profile.
- Backup workflow + **restore drill into the staging project**, documented in `docs/restore.md`.
- Seed realistic **synthetic** demo farms (dairy + poultry) for demos.
- Playwright: workflows A–E at 390×844 viewport.
- **Done when:** every item in PRD §12 acceptance criteria is checked off with a linked test or manual verification note.

**Total:** roughly 14–17 weeks to a pilot-ready MVP.

---

## 6. Testing strategy

| Layer | Tool | Covers |
|---|---|---|
| Database | pgTAP via `supabase test db` (runs in CI with the local Supabase stack) | RLS matrix, cross-farm isolation, every RPC, PRD §7 calculation rules, reversals, idempotency, negative-stock guard, immutability triggers |
| Frontend unit | Vitest | Formatting, unit conversion preview, zod schemas, line-total previews |
| End-to-end | Playwright (mobile viewport) | Workflows A–E, permission-based navigation |
| Manual | Pilot checklist | Daily comparison with paper registers (PRD §13) |

Rule: when a calculation runs in both the UI and the DB, the DB value is shown after save, and a test confirms the two match on fixtures.

---

## 7. Security & data-handling checklist

- RLS enabled on **all** tables (CI check: query `pg_tables` for any table with RLS disabled → fail).
- Only the `anon` key goes in the frontend. The `service_role` key exists only in GitHub Actions secrets and Edge Function env, never in the repo.
- Storage buckets are private; paths are `farm_id/...` with storage policies using the same role helper; files are served via signed URLs.
- Rate limits: rely on Supabase Auth limits; enable CAPTCHA (Cloudflare Turnstile, free) on signup.
- Sentry/console logs strip customer/employee contact details.
- Seed and test data are synthetic only.
- All generated code, migrations, and security policies get technical and security review before production deploys.

---

## 8. SaaS concerns deferred until after the pilot

- **Billing/subscriptions:** add a `plans`/`farm_subscriptions` table now (all farms on `pilot`), and integrate a payment provider later.
- **Super-admin console:** use the Supabase dashboard for now.
- **Urdu/RTL:** strings are already in i18next; translate once pilot terminology is known (PRD §13).
- **Offline data entry, WhatsApp reminders, health/breeding modules:** PRD §5. Validate demand first.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Free Supabase project pauses after inactivity | The nightly backup job queries the DB; pilot farms use the app daily anyway |
| No automated backups on the free tier | GitHub Actions `pg_dump` → R2, plus a restore drill each phase-end |
| Built-in email limits break signups | Custom SMTP (Resend/Brevo) from Phase 0 |
| RLS mistakes leak data across farms | pgTAP isolation suite on every table + CI check that RLS is enabled |
| Logic split between UI and DB drifts | All state-changing logic in RPCs; UI only previews |
| Slow on cheap phones / weak signal | Route splitting, small bundles, TanStack Query caching, no heavy chart libs on entry screens |
| Accounting misunderstood as formal profit | "Estimated operating summary" label + calculation drill-down + documented policy in `docs/calculation-rules.md` |
| Outgrowing 500 MB / egress | Monitor in Supabase dashboard; upgrade to Pro (~$25/mo) when revenue starts |

---

## 10. Open questions (sensible defaults assumed)

1. **Inventory costing:** weighted average assumed. FIFO only if pilots need it.
2. **Customer balance sign convention:** positive = customer owes the farm; supplier positive = farm owes supplier.
3. **Milk stock:** milk tracked as stock by default for dairy template (production in, sales out, wastage) so unsold milk is visible.
4. **Worker inventory access:** off by default; owner can enable "workers can record feed consumption".
5. **Multiple farms per account:** supported from day one through memberships (cheap to add now, expensive later), even though multi-farm reporting is a future module.

---

## 11. Immediate next steps

1. Create the GitHub repo, two Supabase projects (`farm-staging`, `farm-prod`), Cloudflare Pages project, Resend account.
2. Phase 0 scaffold (Vite + Tailwind + shadcn + Supabase CLI + CI).
3. Write the first migration (tenancy + RLS helpers) and the cross-farm isolation pgTAP test before any feature tables.
