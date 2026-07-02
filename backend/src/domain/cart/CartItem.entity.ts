import { DomainError } from '../shared/DomainError.js';

export interface CartItemProps {
  id: string;
  userId: string;
  itemId: string;
  qty: number;
  reservedAt: Date;
}

/**
 * A CartItem represents a reservation the user is holding. Its existence means
 * stock has already been atomically decremented in Redis. Pure domain entity.
 */
export class CartItem {
  readonly id: string;
  readonly userId: string;
  readonly itemId: string;
  readonly qty: number;
  readonly reservedAt: Date;

  constructor(props: CartItemProps) {
    if (!Number.isInteger(props.qty) || props.qty <= 0) {
      throw new DomainError('Cart item quantity must be a positive integer');
    }
    this.id = props.id;
    this.userId = props.userId;
    this.itemId = props.itemId;
    this.qty = props.qty;
    this.reservedAt = props.reservedAt;
  }

  toJSON(): CartItemProps {
    return {
      id: this.id,
      userId: this.userId,
      itemId: this.itemId,
      qty: this.qty,
      reservedAt: this.reservedAt,
    };
  }
}
