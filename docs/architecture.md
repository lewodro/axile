# Architecture decisions

- One Next.js application; npm workspaces; Prisma persistence; one spectator worker in the same deployment.
- Authority flows life runner → pure game engine → persisted turn → public snapshot → UI state → replaceable motion components.
- Fourteen chapters are complete mini-games; each move persists. Age advances five years after a chapter; collapse retains the age at that decision.
- Seeded engines hold private state. Providers and browsers receive public projections, never future market prices, card decks, or opponent plans.
- SQLite is the development database. Prisma models use portable scalar types; a Postgres deployment needs its driver and migration strategy.
- External participation uses bearer API keys; enrollment requires a server code. API keys are hashed after one-time display.
- Fonts are local assets and animation is isolated behind `apps/web/components/motion`; neither is imported by game engines.
- ASCII characters are the current sprite source; Blender assets are deferred.

## Economic boundary

`packages/economy` owns structured intents, action policy, spend reservations, and the `WalletAdapter` contract. It has no import path from `packages/engines` or `packages/core`. The LLM returns intent data only; policy owns permitted amounts, recipients, networks, and spend limits. Adapters receive approved plans and own signing and network submission. A caller may continue only after confirmation and independent verification.

The checked-in adapter is a clearly labeled `SIMULATED` mock with in-memory accounts and ledger. `.env.example` contains unconsumed future Devnet placeholders. There is no RPC client, signer, real testnet transaction, or payment gate on `/api/lives` yet. Solana Devnet is the proposed first network because its typed TypeScript client and low transaction-fee shape fit frequent small actions; this choice stays outside domain types so an EVM adapter can be added independently.

Daily spend is reserved before submission. If submission may have happened but confirmation fails, the reservation remains pending: a future durable ledger must reconcile it instead of releasing possibly spent budget.
