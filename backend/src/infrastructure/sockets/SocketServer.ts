import type { Server as HttpServer } from 'node:http';
import { Server as IOServer } from 'socket.io';
import { StockBroadcaster } from '../../application/ports/StockBroadcaster.js';

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
      console.log(`[socket] client connected: ${socket.id}`);
      socket.on('disconnect', () =>
        console.log(`[socket] client disconnected: ${socket.id}`),
      );
    });
  }

  emitStockUpdate(itemId: string, remaining: number): void {
    this.io.emit('stock:update', { itemId, remaining });
  }
}
