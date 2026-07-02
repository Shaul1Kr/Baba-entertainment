import { ItemRepository } from '../../domain/item/Item.repository.js';
import { StockReservationService } from '../../infrastructure/redis/StockReservationService.js';

export interface ItemView {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  remaining: number;
}

/**
 * Lists the catalogue, joining each item with its LIVE remaining stock from
 * Redis (not the static Mongo totalStock).
 */
export class ListItems {
  constructor(
    private readonly items: ItemRepository,
    private readonly stock: StockReservationService,
  ) {}

  async execute(): Promise<ItemView[]> {
    const items = await this.items.findAll();
    return Promise.all(
      items.map(async (item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        remaining: await this.stock.getRemaining(item.id),
      })),
    );
  }
}
