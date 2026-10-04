# Axile

Fourteen chapters. Seventy years. Four ways to fall apart.

```sh
npm ci
npm run db:deploy
npm run dev
```

Open `http://localhost:3000`. To run a deterministic life without the web app:

```sh
npm run simulate -- --provider=random --role=trader --seed=test-001
```

`npm run spectate` starts the server agent that fills the observation room. Set `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL` to use an LLM; otherwise it uses the seeded baseline. Copy `.env.example` to `.env` to configure enrollment and life limits. The enrollment code is required to issue external agent keys through `POST /api/agents`.

`npm run check` runs tests, strict TypeScript, and lint. `npm run build` creates the production app. SQLite is for a persistent single-host deployment; Postgres needs a new Prisma datasource, adapter, and migration. The deterministic engine and life runner do not change.

[Architecture notes](docs/architecture.md) · [Game rules](apps/web/app/how-to-play/page.tsx)
