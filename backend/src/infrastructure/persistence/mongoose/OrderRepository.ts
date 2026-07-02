import { Order } from '../../../domain/order/Order.entity.js';
import { OrderRepository } from '../../../domain/order/Order.repository.js';
import { OrderDoc, OrderModel } from './schemas.js';

/** Mongoose-backed implementation of the domain OrderRepository interface. */
export class MongooseOrderRepository implements OrderRepository {
  private toEntity(doc: OrderDoc): Order {
    return new Order({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      items: doc.items.map((l) => ({
        itemId: l.itemId.toString(),
        qty: l.qty,
        price: l.price,
      })),
      total: doc.total,
      createdAt: doc.createdAt,
    });
  }

  async save(order: Order): Promise<Order> {
    const created = await OrderModel.create({
      userId: order.userId,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt,
    });
    return this.toEntity(created.toObject() as OrderDoc);
  }

  async findByUser(userId: string): Promise<Order[]> {
    const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean<OrderDoc[]>();
    return docs.map((d) => this.toEntity(d));
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await OrderModel.findById(id).lean<OrderDoc | null>();
    return doc ? this.toEntity(doc) : null;
  }
}
