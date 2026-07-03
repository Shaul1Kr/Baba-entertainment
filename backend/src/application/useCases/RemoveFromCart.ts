import { CartItemRepository } from '../../domain/cart/CartItem.repository.js';
import { StockReservationService } from '../../infrastructure/redis/StockReservationService.js';
import { StockBroadcaster } from '../ports/StockBroadcaster.js';
import { Logger } from '../ports/Logger.js';

export interface RemoveFromCartInput {
  userId: string;
  itemId: string;
}

export interface RemoveFromCartOutput {
  remaining: number;
}

/**
 * Removes an item from the cart BEFORE checkout: immediately returns the
 * reserved stock to Redis, deletes the reservation key(s), and removes the
 * cart row(s). Because a user may have several reservation rows for the same
 * item, we release every matching row.
 */
export class RemoveFromCart {
  constructor(
    private readonly cart: CartItemRepository,
    private readonly stock: StockReservationService,
    private readonly broadcaster: StockBroadcaster,
    private readonly logger: Logger,
  ) {}

  async execute(input: RemoveFromCartInput): Promise<RemoveFromCartOutput> {
    const rows = (await this.cart.findByUser(input.userId)).filter(
      (c) => c.itemId === input.itemId,
    );

    let remaining = await this.stock.getRemaining(input.itemId);
    let released = 0;
    for (const row of rows) {
      remaining = await this.stock.release(row.itemId, row.id, row.qty);
      released += row.qty;
      await this.cart.deleteById(row.id);
    }

    this.broadcaster.emitStockUpdate(input.itemId, remaining);
    this.logger.info(
      { event: 'cart.remove', itemId: input.itemId, qtyReleased: released, remaining },
      'removed from cart; stock released',
    );
    return { remaining };
  }
}
