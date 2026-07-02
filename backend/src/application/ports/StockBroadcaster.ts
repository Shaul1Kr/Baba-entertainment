/**
 * Application-layer PORT for pushing live stock changes to clients.
 *
 * Use cases depend on this interface, not on Socket.io directly, so the
 * application layer stays transport-agnostic. The concrete implementation
 * (infrastructure/sockets/SocketServer.ts) adapts it to Socket.io.
 */
export interface StockBroadcaster {
  emitStockUpdate(itemId: string, remaining: number): void;
}
