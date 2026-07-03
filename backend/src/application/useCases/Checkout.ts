import { Types } from 'mongoose';
import { CartItemRepository } from '../../domain/cart/CartItem.repository.js';
import { ItemRepository } from '../../domain/item/Item.repository.js';
import { Order, OrderLine } from '../../domain/order/Order.entity.js';
import { OrderRepository } from '../../domain/order/Order.repository.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { StockReservationService } from '../../infrastructure/redis/StockReservationService.js';
import { StockBroadcaster } from '../ports/StockBroadcaster.js';
import { Logger } from '../ports/Logger.js';

export interface CheckoutInput {
  userId: string;
}

export interface CheckoutOutput {
  orderId: string;
  total: number;
  items: OrderLine[];
}

/**
 * Converts the user's active reservations into an Order and clears the cart.
 *
 * No stock math is needed here — units were already atomically reserved at
 * add-to-cart time. We DO cancel each reservation's expiry key (clearReservationKey)
 * so a later expiry can't wrongly credit sold stock back. Multiple cart rows for
 * the same item are grouped into a single order line.
 */
export class Checkout {
  constructor(
    private readonly cart: CartItemRepository,
    private readonly items: ItemRepository,
    private readonly orders: OrderRepository,
    private readonly stock: StockReservationService,
    private readonly broadcaster: StockBroadcaster,
    private readonly logger: Logger,
  ) {}

  async execute(input: CheckoutInput): Promise<CheckoutOutput> {
    const rows = await this.cart.findByUser(input.userId);
    if (rows.length === 0) {
      throw new DomainError('Cart is empty');
    }

    // Group reserved rows by item and sum quantities.
    const qtyByItem = new Map<string, number>();
    for (const row of rows) {
      qtyByItem.set(row.itemId, (qtyByItem.get(row.itemId) ?? 0) + row.qty);
    }

    // Build order lines, pulling the price from the catalogue.
    const lines: OrderLine[] = [];
    for (const [itemId, qty] of qtyByItem) {
      const item = await this.items.findById(itemId);
      if (!item) throw new DomainError(`Item ${itemId} no longer exists`);
      lines.push({ itemId, qty, price: item.price });
    }

    const order = Order.create({
      id: new Types.ObjectId().toString(),
      userId: input.userId,
      items: lines,
    });
    const saved = await this.orders.save(order);

    // Cancel reservation expiry keys (sold, not abandoned) and clear the cart.
    for (const row of rows) {
      await this.stock.clearReservationKey(row.id);
    }
    await this.cart.deleteByUser(input.userId);

    // Stock is unchanged, but re-broadcast current remaining so every client
    // is provably in sync after the purchase.
    for (const itemId of qtyByItem.keys()) {
      const remaining = await this.stock.getRemaining(itemId);
      this.broadcaster.emitStockUpdate(itemId, remaining);
    }

    this.logger.info(
      {
        event: 'checkout',
        userId: input.userId,
        orderId: saved.id,
        itemCount: saved.items.length,
        total: saved.total,
      },
      'checkout complete',
    );
    return { orderId: saved.id, total: saved.total, items: saved.items };
  }
}
