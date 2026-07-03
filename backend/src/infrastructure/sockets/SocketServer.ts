import type { Server as HttpServer } from 'node:http';
import { Server as IOServer } from 'socket.io';
import { StockBroadcaster } from '../../application/ports/StockBroadcaster.js';
import { logger } from '../logging/logger.js';

/**
 * Socket.io adapter implementing the StockBroadcaster port. Every add / remove
 * / checkout / expiry that changes availability emits `stock:update` to ALL
 * connected clients, so the storefront updates live with no polling.
 */
export class SocketServer implements StockBroadcaster {
  private readonly io: IOServer;

  constructor(httpServer: HttpServer, corsOrigin: string[]) {
    this.io = new IOServer(httpServer, {
      cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
    });

    this.io.on('connection', (socket) => {
      logger.debug({ component: 'socket', socketId: socket.id }, 'client connected');
      socket.on('disconnect', () =>
        logger.debug({ component: 'socket', socketId: socket.id }, 'client disconnected'),
      );
    });
  }

  emitStockUpdate(itemId: string, remaining: number): void {
    this.io.emit('stock:update', { itemId, remaining });
    // Fires on every add/remove/checkout/expiry — debug level to keep prod logs
    // readable in a busy sale.
    logger.debug(
      { component: 'socket', event: 'stock:update', itemId, remaining },
      'broadcast stock:update',
    );
  }
}
