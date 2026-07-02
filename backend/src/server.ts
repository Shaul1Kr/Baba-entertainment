import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { composeApp } from './composition.js';
import { seedStock } from './bootstrap/seedStock.js';
import { connectMongo } from './infrastructure/persistence/mongoose/connection.js';
import { redis, subscriber, closeRedis } from './infrastructure/redis/RedisClient.js';
import { StockReservationService } from './infrastructure/redis/StockReservationService.js';
import { ReservationExpirySubscriber } from './infrastructure/redis/ReservationExpirySubscriber.js';
import { SocketServer } from './infrastructure/sockets/SocketServer.js';
import { buildRoutes } from './interfaces/http/routes.js';
import { errorHandler } from './interfaces/http/middleware/errorHandler.js';

async function main(): Promise<void> {
  // --- Infrastructure connections ---
  await connectMongo();

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
  app.use('/', buildRoutes(controllers, repositories.users));
  app.use(errorHandler);

  // --- Seed live stock (reconciling against outstanding reservations) ---
  await seedStock(repositories.items, repositories.cart, stock);

  // --- Event-driven reservation expiry ---
  const expirySubscriber = new ReservationExpirySubscriber(subscriber, (cartItemId) =>
    useCases.expireReservation.execute({ cartItemId }),
  );
  await expirySubscriber.start();

  httpServer.listen(env.port, () => {
    console.log(`[http] flash-sale backend listening on :${env.port}`);
    console.log(`[config] reservation TTL = ${env.reservationTtlSeconds}s`);
  });

  // --- Graceful shutdown ---
  const shutdown = async () => {
    console.log('\n[shutdown] closing connections...');
    httpServer.close();
    await closeRedis();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[fatal] failed to start server', err);
  process.exit(1);
});
