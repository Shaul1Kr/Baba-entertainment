# PROMPTS.md

A chronological log of the prompts given during this build and a one-line summary of what was done in response to each.

| # | Prompt (summary) | Response (what was done) |
|---|------------------|--------------------------|
| 1 | Build a flash-sale store take-home: Node/Express/TS + MongoDB + Redis + Angular, DDD backend, Redis Lua atomic stock, event-driven reservation expiry, Socket.io live stock, Vegas-style Angular UI, Docker infra. Give a numbered plan first and confirm before Phase 1. | Produced a 5-phase numbered plan, stated tech defaults (tsx, Express 4, Angular standalone, Bearer=userId), and asked for confirmation. |
| 2 | Confirmed the plan ("Yes, start Phase 1"). | Scaffolded repo: docker-compose (mongo + redis w/ keyspace notifications), .env.example, backend TS project, domain entities + repository interfaces, Mongoose implementations, Redis client + Lua reserve script + StockReservationService + reservation-expiry subscriber. |
