import { Order } from './Order.entity.js';

/**
 * Repository INTERFACE for orders. Domain-layer only.
 */
export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findByUser(userId: string): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
}
