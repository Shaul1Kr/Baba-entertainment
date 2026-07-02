import { CartItemRepository } from '../domain/cart/CartItem.repository.js';
import { ItemRepository } from '../domain/item/Item.repository.js';
import { StockReservationService } from '../infrastructure/redis/StockReservationService.js';

/**
 * Seed Redis live-stock counters from Mongo on startup, RECONCILING against any
 * outstanding cart reservations:
 *
 *     available = totalStock - sum(active reservation quantities)
 *
 * This makes startup safe even if Redis was flushed/restarted while carts still
 * held reservations in Mongo — we don't blindly reset to totalStock and oversell.
 * (See ARCHITECTURE.md: the tradeoff of event-driven expiry is that a Redis
 * restart drops pending expiries; this seed is the reconciliation counterpart.)
 */
export async function seedStock(
  items: ItemRepository,
  cart: CartItemRepository,
  stock: StockReservationService,
): Promise<void> {
  const allItems = await items.findAll();

  const reservedByItem = new Map<string, number>();
  for (const { itemId, qty } of await cart.aggregateReservedQuantities()) {
    reservedByItem.set(itemId, (reservedByItem.get(itemId) ?? 0) + qty);
  }

  for (const item of allItems) {
    const reserved = reservedByItem.get(item.id) ?? 0;
    const available = Math.max(0, item.totalStock - reserved);
    await stock.seed(item.id, available);
  }

  console.log(`[seed] seeded live stock for ${allItems.length} item(s)`);
}
