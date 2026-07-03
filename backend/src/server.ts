import http from 'node:http';
import { pathToFileURL } from 'node:url';
import cors from 'cors';
import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { composeApp } from './composition.js';
import { seedStock } from './bootstrap/seedStock.js';
import { seedItemsIfEmpty } from './bootstrap/seedCatalogue.js';
import {
  connectMongo,
  disconnectMongo,
} from './infrastructure/persistence/mongoose/connection.js';
import { redis, subscriber, closeRedis } from './infrastructure/redis/RedisClient.js';
import { StockReservationService } from './infrastructure/redis/StockReservationService.js';
import { ReservationExpirySubscriber } from './infrastructure/redis/ReservationExpirySubscriber.js';
import { SocketServer } from './infrastructure/sockets/SocketServer.js';
import { buildRoutes } from './interfaces/http/routes.js';
import { errorHandler } from './interfaces/http/middleware/errorHandler.js';
import { openapiSpec } from './interfaces/http/openapi.js';

export interface BootstrappedApp {
  app: Express;
  httpServer: http.Server;
  stock: StockReservationService;
  repositories: ReturnType<typeof composeApp>['repositories'];
  redis: typeof redis;
  /** Tear down all connections (used by integration tests). */
  close: () => Promise<void>;
}

/**
 * Builds and wires the whole application WITHOUT starting to listen. Extracted
 * from the previous inline `main()` so integration tests can drive the real app
 * (Supertest) against real Mongo/Redis. Behaviour is unchanged; `start()` below
 * is the production entrypoint and simply calls this then `listen()`.
 */
export async function bootstrap(): Promise<BootstrappedApp> {
  // --- Infrastructure connections ---
  await connectMongo();

  // Auto-seed the demo catalogue on first run (Item collection only, idempotent).
  await seedItemsIfEmpty();

  const stock = new StockReservationService(redis, env.reservationTtlSeconds);
  await stock.init(); // preload the Lua reserve script

  // --- HTTP + Socket.io (broadcaster) ---
  const app = express();
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  const httpServer = http.createServer(app);
  const broadcaster = new SocketServer(httpServer, env.corsOrigin);

  // --- Compose application ---
  const { repositories, useCases, controllers } = composeApp({ stock, broadcaster });

  app.get('/health', (_req, res) => res.json({ ok: true }));
  // Interactive API docs (additive; describes the existing routes).
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.use('/', buildRoutes(controllers, repositories.users));
  app.use(errorHandler);

  // --- Seed live stock (reconciling against outstanding reservations) ---
  await seedStock(repositories.items, repositories.cart, stock);

  // --- Event-driven reservation expiry ---
  const expirySubscriber = new ReservationExpirySubscriber(subscriber, (cartItemId) =>
    useCases.expireReservation.execute({ cartItemId }),
  );
  await expirySubscriber.start();

  const close = async (): Promise<void> => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await closeRedis();
    await disconnectMongo();
  };

  return { app, httpServer, stock, repositories, redis, close };
}

/** Production entrypoint: bootstrap, then listen and register shutdown hooks. */
async function start(): Promise<void> {
  const { httpServer } = await bootstrap();

  httpServer.listen(env.port, () => {
    console.log(`[http] flash-sale backend listening on :${env.port}`);
    console.log(`[http] API docs at http://localhost:${env.port}/api-docs`);
    console.log(`[config] reservation TTL = ${env.reservationTtlSeconds}s`);
  });

  const shutdown = async () => {
    console.log('\n[shutdown] closing connections...');
    httpServer.close();
    await closeRedis();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Only auto-start when run directly (node/tsx src/server.ts), NOT when imported
// by a test. Keeps the app importable without spinning up a listener.
const isDirectRun =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  start().catch((err) => {
    console.error('[fatal] failed to start server', err);
    process.exit(1);
  });
}
