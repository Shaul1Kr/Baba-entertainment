import { Types } from 'mongoose';
import { CartItem } from '../../domain/cart/CartItem.entity.js';
import { CartItemRepository } from '../../domain/cart/CartItem.repository.js';
import { ItemRepository } from '../../domain/item/Item.repository.js';
import { DomainError, OutOfStockError } from '../../domain/shared/DomainError.js';
import { StockReservationService } from '../../infrastructure/redis/StockReservationService.js';
import { StockBroadcaster } from '../ports/StockBroadcaster.js';
import { Logger } from '../ports/Logger.js';

export interface UpdateCartItemQuantityInput {
  userId: string;
  itemId: string;
  /** Signed integer change: +N reserves N more, -N releases N. Never 0. */
  delta: number;
}

export interface UpdateCartItemQuantityOutput {
  itemId: string;
  qty: number;
  remaining: number;
}

/**
 * Adjusts an item's quantity in the cart by a signed delta, going through the
 * SAME atomic Redis path the other cart operations use:
 *  - Increase (delta > 0): atomic reserve (reserveStock Lua) for `delta` — the
 *    identical oversell gate as AddToCart. Failure -> OutOfStockError (409).
 *  - Decrease (delta < 0): release |delta| back to the live pool, the same
 *    increment RemoveFromCart uses. If the item's total qty hits 0 the row(s)
 *    and their reservation keys are removed entirely (no negative/lingering rows).
 *
 * On any successful change the reservation TTL is reset to the full duration so
 * an actively-edited cart doesn't expire mid-adjustment.
 *
 * Because AddToCart may create several reservation rows per item, we operate over
 * all of the user's rows for the item and keep the aggregate consistent.
 */
export class UpdateCartItemQuantity {
  constructor(
    private readonly items: ItemRepository,
    private readonly cart: CartItemRepository,
    private readonly stock: StockReservationService,
    private readonly broadcaster: StockBroadcaster,
    private readonly logger: Logger,
  ) {}

  async execute(input: UpdateCartItemQuantityInput): Promise<UpdateCartItemQuantityOutput> {
    const delta = Number(input.delta);
    if (!Number.isInteger(delta) || delta === 0) {
      throw new DomainError('delta must be a non-zero integer');
    }

    const item = await this.items.findById(input.itemId);
    if (!item) throw new DomainError(`Item ${input.itemId} not found`);

    const rows = (await this.cart.findByUser(input.userId)).filter(
      (r) => r.itemId === input.itemId,
    );
    const currentQty = rows.reduce((sum, r) => sum + r.qty, 0);

    let remaining: number;

    if (delta > 0) {
      remaining = await this.increase(input, rows, delta);
    } else {
      remaining = await this.decrease(input, rows, currentQty, -delta);
    }

    // Reset TTL on any surviving rows for this item — the user is actively
    // editing, so their reservation shouldn't expire mid-adjustment.
    const surviving = (await this.cart.findByUser(input.userId)).filter(
      (r) => r.itemId === input.itemId,
    );
    for (const row of surviving) {
      await this.stock.refreshReservation(row.id);
    }
    const newQty = surviving.reduce((sum, r) => sum + r.qty, 0);

    this.broadcaster.emitStockUpdate(input.itemId, remaining);
    this.logger.info(
      { event: 'cart.update', itemId: input.itemId, delta, qty: newQty, remaining },
      'cart quantity updated',
    );
    return { itemId: input.itemId, qty: newQty, remaining };
  }

  /** delta > 0: atomically reserve `delta` more units (same gate as AddToCart). */
  private async increase(
    input: UpdateCartItemQuantityInput,
    rows: CartItem[],
    delta: number,
  ): Promise<number> {
    // Target an existing reservation row if present (its reservation key TTL is
    // reset by reserve()); otherwise start a fresh row, exactly like AddToCart.
    const targetId = rows.length > 0 ? rows[0].id : new Types.ObjectId().toString();

    const result = await this.stock.reserve(input.itemId, targetId, delta);
    if (!result.ok) {
      this.logger.info(
        { event: 'cart.update.rejected', itemId: input.itemId, delta, reason: 'out_of_stock' },
        'cart update rejected: out of stock',
      );
      throw new OutOfStockError(input.itemId);
    }

    const baseQty = rows.length > 0 ? rows[0].qty : 0;
    await this.cart.save(
      new CartItem({
        id: targetId,
        userId: input.userId,
        itemId: input.itemId,
        qty: baseQty + delta,
        reservedAt: new Date(),
      }),
    );
    return result.remaining;
  }

  /** delta < 0: release units back, deleting rows that reach 0. */
  private async decrease(
    input: UpdateCartItemQuantityInput,
    rows: CartItem[],
    currentQty: number,
    amount: number,
  ): Promise<number> {
    // Never release more than is actually reserved.
    let need = Math.min(amount, currentQty);
    let remaining = await this.stock.getRemaining(input.itemId);

    for (const row of rows) {
      if (need <= 0) break;
      if (row.qty <= need) {
        // Whole row released and removed (reservation key cleared).
        remaining = await this.stock.release(input.itemId, row.id, row.qty, true);
        await this.cart.deleteById(row.id);
        need -= row.qty;
      } else {
        // Partial release; row survives with a smaller qty.
        remaining = await this.stock.release(input.itemId, row.id, need, false);
        await this.cart.save(
          new CartItem({
            id: row.id,
            userId: input.userId,
            itemId: input.itemId,
            qty: row.qty - need,
            reservedAt: new Date(),
          }),
        );
        need = 0;
      }
    }
    return remaining;
  }
}
