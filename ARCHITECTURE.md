# Architecture

This document explains the structure and the deliberate design decisions behind the
flash-sale store — especially the ones where a "more" option existed and was
intentionally **not** taken.

---

## 1. Backend: pragmatic Domain-Driven Design

The backend is layered into four concentric rings, with dependencies pointing **inward
only**:

```
interfaces/http     →  application/useCases  →  domain
                          ↘ infrastructure ↗   (implements domain interfaces)
```

| Layer | Contains | Depends on |
|-------|----------|------------|
| `domain/` | Entities (`Item`, `CartItem`, `Order`, `User`) + repository **interfaces** | nothing — pure TypeScript |
| `application/` | Use cases (one per action) + ports (`StockBroadcaster`) | `domain/` only |
| `infrastructure/` | Mongoose repos, Redis (Lua + reservation service + expiry subscriber), Socket.io | implements `domain`/`application` interfaces |
| `interfaces/http/` | Express routes + thin controllers | `application/` |

**Rules enforced:**

- `domain/` imports **no** Mongoose, Redis, or Express — verify with
  `grep -rE "mongoose|ioredis|express" backend/src/domain` (returns nothing).
- Entities own their invariants: `Item` refuses negative stock, `CartItem` refuses a
  non-positive qty, `Order` derives its total from its lines so it can't drift.
- Repository **interfaces** live in `domain/{context}/*.repository.ts`; the Mongoose
  **implementations** live in `infrastructure/persistence/mongoose/`. The composition
  root (`composition.ts`) is the only place the two are bound together.
- Controllers are **thin**: parse the request → call one use case → format the response.
  All error→status mapping is centralized in one Express error handler.

### Why scoped down from full CQRS / event sourcing

Full CQRS (separate read/write models) and event sourcing (rebuild state from an event
log) are excellent for large domains with complex audit/temporal requirements and teams
that need read/write to scale independently. **This app has six endpoints and one
aggregate that matters (stock).** Introducing command/query buses, projections, and an
event store here would be architecture cosplay — more indirection to read, more code to
maintain, and no actual problem solved.

So the scope is deliberately **entities + repository interfaces + use cases**. That
still delivers the real benefits of DDD — a pure, testable domain; swappable
infrastructure; one clear place per action — without the ceremony. If this grew into a
real marketplace (orders, payments, fulfilment, refunds, analytics), CQRS on the read
side and an event log for orders would be the natural next step.

---

## 2. Concurrency: why a Redis Lua script for atomicity

The hard requirement is **stock must never go negative or oversell under concurrent
requests**, and it decrements at *add-to-cart* time.

The naive approach — read stock in Node, check it, then write it back — has a
check-then-act race: two requests both read "1 left", both pass the check, both
decrement, and you've sold two of one item. Locks or Mongo transactions can fix this but
add latency and contention on the hot path.

Instead, the live counter lives in **Redis**, and add-to-cart runs a **Lua script**
([`reserveStock.lua`](./backend/src/infrastructure/redis/reserveStock.lua)):

```
if GET stock < qty then return -1 end     -- reject
DECRBY stock qty                           -- reserve
SET reservation:{cartItemId} qty EX ttl    -- register expiry
return remaining
```

Redis executes commands **single-threaded**, and a Lua script runs as **one
uninterruptible unit**. There is therefore *no window* between the check and the
decrement — the oversell race is structurally impossible, with no application-level
locking. A return of `-1` means "not enough stock" → the API responds `409`.

This was verified: 20 concurrent add requests against a 3-stock item yield exactly 3
successes, 17× `409`, and a final Redis count of `0`.

Mongo remains the source of truth for the *catalogue* and *orders*; Redis is the source
of truth for *live availability*. On startup the counters are **reconciled**:
`available = totalStock − Σ(outstanding reservations)`, so a restart can't double-count.

---

## 3. Reservation expiry: event-driven, not polled

An abandoned cart must eventually return its stock. Two ways to do that:

- **Polling / cron:** periodically scan for stale reservations and release them. Simple,
  but wasteful (runs even when nothing expired), and imprecise (release lag = poll
  interval). It also puts recurring query load on the DB.
- **Event-driven (chosen):** Redis is configured with `notify-keyspace-events Ex`, which
  publishes an event the instant any key expires. We give each reservation a key with a
  TTL; when it expires, a subscriber
  ([`ReservationExpirySubscriber`](./backend/src/infrastructure/redis/ReservationExpirySubscriber.ts))
  receives the exact `cartItemId`, and the **`ExpireReservation` use case** returns the
  stock, deletes the cart row, and broadcasts the new count.

The expiry logic runs through the use case, not inline in infrastructure — the subscriber
only translates a Redis event into a use-case call, keeping the release rules in the
application layer.

### The tradeoff (and how a production system would close it)

Keyspace notifications are **fire-and-forget**: if Redis restarts while a reservation is
pending, that expiry event is **not replayed**. In this project that's an acceptable,
documented tradeoff. In production I'd add:

1. a **reconciliation sweep** (the startup seed already does this: it recomputes
   available from `totalStock − outstanding reservations`), and/or
2. a periodic low-frequency job that releases cart rows whose `reservedAt + TTL` is in
   the past — a cheap backstop for the event system, not the primary mechanism.

So: event-driven for precision and zero steady-state cost, with reconciliation as the
safety net — rather than polling as the primary mechanism.

Checkout explicitly **deletes** the reservation keys (stock was sold, not abandoned) so a
later expiry can't wrongly credit sold stock back. This was verified: after checkout,
waiting past the TTL leaves the count unchanged.

---

## 4. Real-time stock: Socket.io push, no polling

Every mutation that changes availability (add / remove / checkout / expiry) calls the
`StockBroadcaster` port, whose Socket.io implementation emits
`stock:update { itemId, remaining }` to all clients. The Angular store patches the
matching item's `remaining` in place. No client ever polls. Verified with two
independent browser sessions: one adds an item, the other's counter drops instantly with
no reload.

`StockBroadcaster` is an **application-layer interface**, so use cases depend on the
abstraction, not on Socket.io — the transport could be swapped (SSE, WebSocket, a message
bus) without touching a single use case.

---

## 5. Frontend: Angular + BehaviorSubject state (no NgRx)

State lives in a single `CartService` built on RxJS `BehaviorSubject`s (session, items,
cart, last order, error), exposed as observables and consumed via the `async` pipe.

**Why no NgRx:** NgRx (actions, reducers, effects, selectors) shines when many
components mutate shared state in complex ways and you need time-travel debugging and
strict traceability. This app has one small store and a handful of actions. A service
with a few subjects is dramatically less boilerplate, easy to follow, and completely
sufficient. Reaching for NgRx here would be the frontend equivalent of the CQRS
over-engineering avoided on the backend — same principle, applied consistently.

The DDD layering is intentionally **backend-only**; the frontend is a straightforward
component + service structure. Styling uses **Tailwind v4** with the casino palette
defined as `@theme` tokens in `styles.css` (utilities like `text-gold`, `bg-card`), with
a few `@apply` classes extracted only for patterns repeated 3+ times (the gold CTA, the
slot-tile card). The confetti/coin-burst is a component-scoped CSS keyframe animation.

---

## 6. Data model

| Entity | Fields | Notes |
|--------|--------|-------|
| `Item` | `_id, name, description, price, imageUrl, totalStock` | `totalStock` is catalogue capacity; live availability is the Redis counter |
| `CartItem` | `_id, userId, itemId, qty, reservedAt` | Existence *is* a held reservation; each carries its own Redis TTL key |
| `Order` | `_id, userId, items[{itemId, qty, price}], total, createdAt` | Price is snapshotted per line so historical orders are stable |
| `User` | `_id, name` | Name-only identity per the brief |

`price` is stored as a plain number for simplicity. In a real store handling money I'd
store integer minor units (cents) to avoid floating-point rounding — called out here as a
known simplification.

---

## 7. Docker setup choices

Only **infrastructure** (Mongo + Redis) is dockerized; the backend and frontend run
locally via npm. For a take-home this gives the best of both: reproducible, one-command
infra (`docker-compose up -d`) without image-rebuild friction on every code change, and
instant hot-reload dev loops for the app code.

- **Mongo** uses a **named volume** so data survives restarts.
- **Redis** is started with `--notify-keyspace-events Ex` via a command override — this
  is not a default, and the event-driven expiry depends on it, so it's pinned in
  `docker-compose.yml` rather than left to manual configuration.

---

## 8. Why TypeScript

TypeScript is what makes the DDD layering *enforceable* rather than aspirational:
repository **interfaces** in the domain layer, `implements` on the infrastructure
classes, and typed use-case inputs/outputs mean a boundary violation is a compile error,
not a code-review nit. It also gives a single shared type vocabulary across backend and
frontend (`Item`, `CartLine`, `Order`, `StockUpdate`), catching contract drift between
the API and the UI at build time. For a concurrency-sensitive app where correctness
matters, that safety net is worth the small amount of ceremony.
