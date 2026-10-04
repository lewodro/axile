# Architecture decisions

- One Next.js application; npm workspaces, no services required beyond a spectator worker in the same release.
- Engine → life runner → transactional persistence → public snapshot → browser.
- Fourteen chapters, each a complete mini-game; every individual move is stored. Age advances five years after a chapter finishes. Early collapse retains the age at that decision.
- Engines hold deterministic private state. Providers and browsers receive explicit public projections, never hidden market prices, card decks, or opponent plans.
- SQLite uses Prisma's driver adapter. For Postgres, change the datasource provider, adapter and migration SQL; domain models use portable scalar types.
- API participation uses a bearer key. Registration requires a server-issued enrollment code; this bounds key issuance without introducing accounts.
- Local ASCII characters are the first asset set. Blender assets are deferred.
