import { CartItemRepository } from '../../domain/cart/CartItem.repository.js';
import { ItemRepository } from '../../domain/item/Item.repository.js';

export interface CartLineView {
  itemId: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}

export interface CartView {
  lines: CartLineView[];
  total: number;
}

/**
 * Returns the user's cart, grouping the (possibly multiple) reservation rows
 * per item into a single display line and enriching with catalogue data.
 */
export class GetCart {
  constructor(
    private readonly cart: CartItemRepository,
    private readonly items: ItemRepository,
  ) {}

  async execute(userId: string): Promise<CartView> {
    const rows = await this.cart.findByUser(userId);

    const qtyByItem = new Map<string, number>();
    for (const row of rows) {
      qtyByItem.set(row.itemId, (qtyByItem.get(row.itemId) ?? 0) + row.qty);
    }

    const lines: CartLineView[] = [];
    let total = 0;
    for (const [itemId, qty] of qtyByItem) {
      const item = await this.items.findById(itemId);
      if (!item) continue;
      total += item.price * qty;
      lines.push({
        itemId,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        qty,
      });
    }

    return { lines, total };
  }
}
