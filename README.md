# FarmBook

Farm management SaaS for small and medium dairy, livestock and poultry farms.
See [farm_management_system_prd.md](farm_management_system_prd.md) for requirements and
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for architecture and phases.

**Stack:** React + TypeScript + Vite · Supabase (Postgres, Auth, Storage) · Tailwind CSS · TanStack Query

## Local development

Requirements: Node 20.19+ and Docker Desktop (running).

There is no `docker-compose.yml`. The Supabase CLI starts and manages all backend containers
(Postgres 17, Auth, REST API, Storage, Realtime, Studio, Mailpit email inbox, Edge Functions).
Redis and other services are not needed.

```bash
npm install            # if npm 10 fails with "edgesOut", use: npx npm@11 install
npm run db:start       # first run downloads the Docker images (several minutes)
cp .env.example .env.local
npm run db:status      # copy API URL and Publishable key into .env.local
npm run dev            # http://localhost:5173
```

| Local service | URL |
|---|---|
| App | http://localhost:5173 |
| Supabase Studio (database UI) | http://127.0.0.1:54323 |
| Mailpit (catches auth emails) | http://127.0.0.1:54324 |
| API | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

Email confirmation is off locally, so new accounts sign in straight away.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app |
| `npm run lint` / `npm run typecheck` / `npm test` | oxlint, TypeScript, Vitest unit tests |
| `npm run build` | Production build into `dist/` |
| `npm run db:start` / `db:stop` | Start/stop the local Supabase containers |
| `npm run db:reset` | Recreate the local database from `supabase/migrations` |
| `npm run db:test` | Run pgTAP database tests in `supabase/tests` (RLS, RPCs) |
| `npm run db:types` | Regenerate `src/types/database.ts` after a migration |

## Changing the database

1. Add a new file in `supabase/migrations/` (`npx supabase migration new <name>`). Don't edit migrations that have been deployed.
2. Enable RLS and add policies for every new table; add tests in `supabase/tests/`.
3. `npm run db:reset && npm run db:test && npm run db:types`.

Use synthetic data only in seeds and tests.
