import { CartItemRepository } from '../../domain/cart/CartItem.repository.js';
import { StockReservationService } from '../../infrastructure/redis/StockReservationService.js';
import { StockBroadcaster } from '../ports/StockBroadcaster.js';

export interface ExpireReservationInput {
  cartItemId: string;
}

/**
 * Runs when a `reservation:{cartItemId}` key expires (fired event-driven by the
 * keyspace subscriber, never polled). Returns the abandoned units to the live
 * pool, deletes the cart row, and broadcasts the new remaining.
 *
 * Idempotent: if the cart row is already gone (checked out or manually removed),
 * we do nothing — its stock was handled at that time.
 */
export class ExpireReservation {
  constructor(
    private readonly cart: CartItemRepository,
    private readonly stock: StockReservationService,
    private readonly broadcaster: StockBroadcaster,
  ) {}

  async execute(input: ExpireReservationInput): Promise<void> {
    const cartItem = await this.cart.findById(input.cartItemId);
    if (!cartItem) return; // already resolved elsewhere — nothing to release

    // The reservation key already expired, so don't try to delete it again.
    const remaining = await this.stock.release(
      cartItem.itemId,
      cartItem.id,
      cartItem.qty,
      false,
    );
    await this.cart.deleteById(cartItem.id);
    this.broadcaster.emitStockUpdate(cartItem.itemId, remaining);
  }
}
