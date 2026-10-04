# Production website pass: session handoff

This branch is an **in-progress** production pass, not a deployable Axile release. It was cut from `032fc70` on 2026-10-04. The production branch has three focused commits (`026`–`028`); `origin/main` has since advanced by three commits (`9302329`, `0e0152a`, `7ea375c`). Review and integrate those changes before extending the branch. Do not replace main or assume the two histories are compatible without testing.

## Completed

- `026_update_fix_production_postgresql_and_environment_contract` adds a PostgreSQL Prisma schema and initial migration, switches the database client by `DATABASE_URL`, validates production environment settings, and keeps SQLite local development available.
- `027_update_fix_public_api_sessions_and_provider_security` signs visitor ownership cookies, validates mutation origins and request sizes, bounds provider responses, restricts provider URLs, and gives public API failures safe messages.
- This handoff records the verified state and the remaining launch work.

## Verified in this session

- `npm run check`: 42 tests passed, TypeScript and lint passed.
- `npm run build` passed with a local PostgreSQL 17 database.
- `npm run db:deploy` applied the PostgreSQL initial migration to a clean database.
- The SQLite migration/build path also passed.
- An earlier baseline browser run opened the app and began the public demo, but the full production journey and mobile layout were **not** verified after these changes.

The disposable local PostgreSQL cluster used port `55432` with `DATABASE_URL=postgresql://miro@127.0.0.1:55432/axile_production`. It is a development test fixture, not a production dependency. No credentials or private keys are in this document.

## Next implementation steps

1. Inspect the three new `origin/main` commits, integrate them, and rerun SQLite and clean PostgreSQL migrations, tests, and build. Avoid overwriting any current main work.
2. Make live match progression server-owned and durable: schedule/lease jobs in PostgreSQL, run a supervised worker alongside the web process, and recover after restarts. Current `npm start` starts only Next; the existing spectator automation script is separate.
3. Complete a fresh-visitor journey from landing through setup, autonomous live match, inspection, result, and another run. Add useful empty and failure states. Keep demo/model-provider labeling honest.
4. Add a safe `/api/health` check covering database and worker liveness; validate production startup, provider budgets, and any remaining input/security boundaries.
5. Add Railway deployment configuration, migration pre-deploy step, `verify:production`, deployment guide, metadata/static asset checks, and CI production/Playwright smoke tests. Test desktop and mobile after these changes.

## Boundaries and known issues

- Intended topology: one Railway app service running Next and a supervised worker, Railway PostgreSQL, optional external model providers, and a Cloudflare-managed domain. This topology is **not configured or verified yet**.
- There is no production health endpoint, Railway config, deploy guide, or clean-install production simulation yet.
- Match/run state and worker scheduling still need a full durability audit. A signed visitor cookie alone does not make the live match process restart-safe.
- The HTTP provider's budget hook exists but is not wired to a durable budget.
- `npm audit` reported four high advisories in Prisma CLI transitive development dependencies (`deepmerge-ts`, `mysql2`). Review upstream fixes before a release; no broad dependency upgrade was attempted here.
- Real payments remain out of scope for the first public launch. Keep them disabled. Document and test a separate payment-enabled deployment path only after the free website is dependable.

## Resume

```sh
cd /Users/miro/Documents/dev/axile-production
git fetch origin
git log --oneline HEAD..origin/main
git status -sb
# Review those main commits, then integrate origin/main into this branch.
npm run check
DATABASE_URL=postgresql://miro@127.0.0.1:55432/axile_production npm run db:deploy
DATABASE_URL=postgresql://miro@127.0.0.1:55432/axile_production npm run build
```

The PostgreSQL URL above works only if that local development cluster is running. A new session can instead create a fresh local PostgreSQL database and substitute its URL. Never run `db:deploy` against a production database before reviewing the migration and taking a backup.
