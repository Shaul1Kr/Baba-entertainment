import { CartItem } from './CartItem.entity.js';

/**
 * Repository INTERFACE for cart items (active reservations). Domain-layer only.
 * Mongoose implementation lives in infrastructure/persistence/mongoose.
 */
export interface CartItemRepository {
  findById(id: string): Promise<CartItem | null>;
  findByUser(userId: string): Promise<CartItem[]>;
  findByUserAndItem(userId: string, itemId: string): Promise<CartItem | null>;
  save(cartItem: CartItem): Promise<CartItem>;
  deleteById(id: string): Promise<void>;
  deleteByUser(userId: string): Promise<void>;
}
