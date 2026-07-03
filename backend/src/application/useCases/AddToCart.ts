import { Types } from 'mongoose';
import { CartItem } from '../../domain/cart/CartItem.entity.js';
import { CartItemRepository } from '../../domain/cart/CartItem.repository.js';
import { ItemRepository } from '../../domain/item/Item.repository.js';
import { DomainError, OutOfStockError } from '../../domain/shared/DomainError.js';
import { StockReservationService } from '../../infrastructure/redis/StockReservationService.js';
import { StockBroadcaster } from '../ports/StockBroadcaster.js';
import { Logger } from '../ports/Logger.js';

export interface AddToCartInput {
  userId: string;
  itemId: string;
  qty: number;
}

export interface AddToCartOutput {
  cartItemId: string;
  remaining: number;
}

/**
 * Reserves stock the MOMENT the item is added to the cart.
 *
 * Order of operations matters for correctness:
 *  1. Atomically reserve in Redis (single-threaded Lua) — this is the gate that
 *     prevents overselling. Failure -> OutOfStockError (HTTP maps to 409).
 *  2. Persist the CartItem in Mongo. If this fails, we ROLL BACK the reservation
 *     so stock never leaks.
 *  3. Broadcast the new remaining to all clients.
 *
 * We pre-generate the Mongo id so the reservation key can reference it before
 * the document is written.
 */
export class AddToCart {
  constructor(
    private readonly items: ItemRepository,
    private readonly cart: CartItemRepository,
    private readonly stock: StockReservationService,
    private readonly broadcaster: StockBroadcaster,
    private readonly logger: Logger,
  ) {}

  async execute(input: AddToCartInput): Promise<AddToCartOutput> {
    const qty = Number(input.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new DomainError('qty must be a positive integer');
    }

    const item = await this.items.findById(input.itemId);
    if (!item) throw new DomainError(`Item ${input.itemId} not found`);

    const cartItemId = new Types.ObjectId().toString();

    // (1) Atomic reserve — the oversell gate.
    const reservation = await this.stock.reserve(item.id, cartItemId, qty);
    if (!reservation.ok) {
      // Core business event: reservation rejected because stock ran out.
      this.logger.info(
        { event: 'cart.add.rejected', itemId: item.id, qty, reason: 'out_of_stock' },
        'add-to-cart rejected: out of stock',
      );
      throw new OutOfStockError(item.id);
    }

    // (2) Persist, rolling back the reservation if the write fails.
    try {
      await this.cart.save(
        new CartItem({
          id: cartItemId,
          userId: input.userId,
          itemId: item.id,
          qty,
          reservedAt: new Date(),
        }),
      );
    } catch (err) {
      await this.stock.release(item.id, cartItemId, qty);
      const remaining = await this.stock.getRemaining(item.id);
      this.broadcaster.emitStockUpdate(item.id, remaining);
      this.logger.error(
        { event: 'cart.add.rollback', itemId: item.id, qty, cartItemId, err },
        'add-to-cart failed after reserve; rolled back reservation',
      );
      throw err;
    }

    // (3) Broadcast live remaining.
    this.broadcaster.emitStockUpdate(item.id, reservation.remaining);
    this.logger.info(
      {
        event: 'cart.add.reserved',
        itemId: item.id,
        qty,
        cartItemId,
        remaining: reservation.remaining,
      },
      'add-to-cart reserved',
    );
    return { cartItemId, remaining: reservation.remaining };
  }
}
