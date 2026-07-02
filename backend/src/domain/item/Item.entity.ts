import { DomainError } from '../shared/DomainError.js';

export interface ItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  totalStock: number;
}

/**
 * Item is a pure domain entity. It owns its own invariants and has zero
 * knowledge of Mongoose, Redis, or Express.
 *
 * Note on stock: the LIVE, authoritative "available" counter lives in Redis
 * (see StockReservationService) because it must be decremented atomically
 * under concurrency. `totalStock` here is the catalogue capacity the Redis
 * counter is seeded from — the entity guarantees it can never be negative.
 */
export class Item {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly imageUrl: string;
  private _totalStock: number;

  constructor(props: ItemProps) {
    if (!props.name || props.name.trim() === '') {
      throw new DomainError('Item name is required');
    }
    if (props.price < 0) {
      throw new DomainError('Item price cannot be negative');
    }
    this.assertNonNegativeStock(props.totalStock);

    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.imageUrl = props.imageUrl;
    this._totalStock = props.totalStock;
  }

  get totalStock(): number {
    return this._totalStock;
  }

  /** Invariant: stock can never go negative. */
  private assertNonNegativeStock(value: number): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainError('Item stock must be a non-negative integer');
    }
  }

  toJSON(): ItemProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      imageUrl: this.imageUrl,
      totalStock: this._totalStock,
    };
  }
}
