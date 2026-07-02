import { DomainError } from '../shared/DomainError.js';

export interface OrderLine {
  itemId: string;
  qty: number;
  price: number;
}

export interface OrderProps {
  id: string;
  userId: string;
  items: OrderLine[];
  total: number;
  createdAt: Date;
}

/**
 * An Order is the immutable record of a completed checkout. Pure domain entity.
 * The total is derived from its lines so it can never drift out of sync.
 */
export class Order {
  readonly id: string;
  readonly userId: string;
  readonly items: OrderLine[];
  readonly total: number;
  readonly createdAt: Date;

  constructor(props: OrderProps) {
    if (props.items.length === 0) {
      throw new DomainError('An order must contain at least one item');
    }
    this.id = props.id;
    this.userId = props.userId;
    this.items = props.items;
    this.total = props.total;
    this.createdAt = props.createdAt;
  }

  /** Factory that computes the total from lines, guaranteeing consistency. */
  static create(params: {
    id: string;
    userId: string;
    items: OrderLine[];
    createdAt?: Date;
  }): Order {
    const total = params.items.reduce(
      (sum, line) => sum + line.price * line.qty,
      0,
    );
    return new Order({
      id: params.id,
      userId: params.userId,
      items: params.items,
      total,
      createdAt: params.createdAt ?? new Date(),
    });
  }

  toJSON(): OrderProps {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items,
      total: this.total,
      createdAt: this.createdAt,
    };
  }
}
