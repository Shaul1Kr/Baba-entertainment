# 🎰 Jackpot Drop — Flash-Sale Store

A real-time flash-sale store where limited stock **can never oversell**, even under
heavy concurrent traffic. Stock is reserved the moment an item is added to the cart,
every connected client sees remaining counts update **live** (no polling), and
abandoned carts auto-release their stock via event-driven expiry.

**Stack:** Node.js (Express) + TypeScript · MongoDB · Redis · Socket.io · Angular (Tailwind v4)
Infra (Mongo + Redis) runs in Docker; the app servers run locally for fast iteration.

> Architecture, design tradeoffs, and the concurrency model are documented in
> [ARCHITECTURE.md](./ARCHITECTURE.md). The build prompt log is in [PROMPTS.md](./PROMPTS.md).

---

## How it works (the important part)

- Redis holds the **authoritative live stock counter** per item (`stock:{itemId}`),
  seeded from Mongo on startup.
- **Add-to-cart** runs a Redis **Lua script** that atomically checks-and-decrements
  stock. Because Redis is single-threaded and the script runs as one unit, concurrent
  requests can never oversell. Out of stock → HTTP `409`.
- Each reservation sets a companion key `reservation:{cartItemId}` with a TTL. When it
  **expires**, Redis keyspace notifications fire an event; a subscriber returns the
  stock and clears the cart row — **no cron, no polling**.
- Every add / remove / checkout / expiry emits a `stock:update` over Socket.io, so all
  browsers stay in sync in real time.

---

## Prerequisites

- **Node.js 20+** and npm
- **Docker Desktop** (for Mongo + Redis)

---

## Running it

### 1. Start infrastructure (Mongo + Redis)

From the project root:

```bash
docker-compose up -d
```

This starts:
- **MongoDB** on `27017` (named volume for persistence)
- **Redis** on `6379` with `--notify-keyspace-events Ex` (required for reservation expiry)

### 2. Start the backend

```bash
cd backend
cp ../.env.example .env      # sane defaults already point at the docker services
npm install
npm run seed                 # loads demo catalogue + seeds Redis stock counters
npm start                    # http://localhost:3000
```

Environment variables (see `.env.example`):

| Var | Default | Meaning |
|-----|---------|---------|
| `PORT` | `3000` | HTTP/Socket.io port |
| `MONGO_URI` | `mongodb://localhost:27017/flashsale` | Mongo connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `RESERVATION_TTL_SECONDS` | `600` | How long a cart reservation is held before auto-release (**dynamic, never hardcoded**) |
| `CORS_ORIGIN` | `http://localhost:4200` | Allowed frontend origin(s), comma-separated |

> Tip: to watch expiry in action, run with a short TTL:
> `RESERVATION_TTL_SECONDS=5 npm start`, add an item, and watch the count return after 5s.

### 3. Start the frontend

```bash
cd frontend
npm install
npm start                    # http://localhost:4200
```

Open **http://localhost:4200**, log in with any name, and start grabbing items.
Open it in **two browser windows** to watch stock counts update live across both.

---

## API

| Method & path | Body | Response |
|---------------|------|----------|
| `POST /auth/login` | `{ name }` | `{ userId, name, token }` |
| `GET /items` | — | `[{ id, name, description, price, remaining, imageUrl }]` |
| `POST /cart/add` | `{ itemId, qty }` | `{ cartItemId, remaining }` · `409` if out of stock |
| `POST /cart/remove` | `{ itemId }` | `{ remaining }` |
| `GET /cart` | — | `{ lines: [...], total }` |
| `POST /checkout` | — | `{ orderId, total, items }` (creates Order, clears cart) |

All routes except `/auth/login` and `/items` require `Authorization: Bearer <token>`
(the token is the user id — deliberately trivial auth per the brief).

Socket.io event: `stock:update { itemId, remaining }`.

---

## Project layout

```
docker-compose.yml        # Mongo + Redis (infra only)
.env.example
backend/                  # Express + TS, Domain-Driven layering (see ARCHITECTURE.md)
  src/domain/             #   entities + repository INTERFACES (zero infra deps)
  src/application/        #   use cases (one per action) + ports
  src/infrastructure/     #   Mongoose repos, Redis (Lua + service + expiry sub), sockets
  src/interfaces/http/    #   thin Express routes + controllers
frontend/                 # Angular standalone + Tailwind v4, BehaviorSubject state (no NgRx)
```

---

## Verifying the concurrency guarantee

Fire 20 concurrent add-to-cart requests at a 3-stock item — exactly 3 succeed, 17 get
`409`, and Redis stock lands at `0` (never negative). See ARCHITECTURE.md for the full
list of scenarios exercised during the build.
