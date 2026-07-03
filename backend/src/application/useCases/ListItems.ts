import { ItemRepository } from '../../domain/item/Item.repository.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { StockReservationService } from '../../infrastructure/redis/StockReservationService.js';

export interface ItemView {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  remaining: number;
}

export interface ListItemsInput {
  page?: number | string;
  limit?: number | string;
}

export interface PagedItems {
  items: ItemView[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

/**
 * Lists a PAGE of the catalogue (offset-based), joining each item on that page
 * with its LIVE remaining stock from Redis (not the static Mongo totalStock).
 * Redis is queried only for the items actually on the page.
 */
export class ListItems {
  constructor(
    private readonly items: ItemRepository,
    private readonly stock: StockReservationService,
  ) {}

  async execute(input: ListItemsInput = {}): Promise<PagedItems> {
    const page = this.parsePositiveInt(input.page, DEFAULT_PAGE, 'page');
    // limit is clamped to a sane maximum rather than rejected.
    const limit = Math.min(
      this.parsePositiveInt(input.limit, DEFAULT_LIMIT, 'limit'),
      MAX_LIMIT,
    );

    const { items, total } = await this.items.findPage(page, limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const view = await Promise.all(
      items.map(async (item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        remaining: await this.stock.getRemaining(item.id),
      })),
    );

    return { items: view, page, limit, total, totalPages };
  }

  /** Coerce & validate a query param to a positive integer (else 400 via DomainError). */
  private parsePositiveInt(
    value: number | string | undefined,
    fallback: number,
    name: string,
  ): number {
    if (value === undefined || value === '') return fallback;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) {
      throw new DomainError(`${name} must be a positive integer`);
    }
    return n;
  }
}
