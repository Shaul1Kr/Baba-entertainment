import { Types } from 'mongoose';
import { CartItem } from '../../../domain/cart/CartItem.entity.js';
import { CartItemRepository } from '../../../domain/cart/CartItem.repository.js';
import { CartItemDoc, CartItemModel } from './schemas.js';

/** Mongoose-backed implementation of the domain CartItemRepository interface. */
export class MongooseCartItemRepository implements CartItemRepository {
  private toEntity(doc: CartItemDoc): CartItem {
    return new CartItem({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      itemId: doc.itemId.toString(),
      qty: doc.qty,
      reservedAt: doc.reservedAt,
    });
  }

  async findById(id: string): Promise<CartItem | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await CartItemModel.findById(id).lean<CartItemDoc | null>();
    return doc ? this.toEntity(doc) : null;
  }

  async findByUser(userId: string): Promise<CartItem[]> {
    const docs = await CartItemModel.find({ userId }).lean<CartItemDoc[]>();
    return docs.map((d) => this.toEntity(d));
  }

  async findByUserAndItem(userId: string, itemId: string): Promise<CartItem | null> {
    const doc = await CartItemModel.findOne({ userId, itemId }).lean<CartItemDoc | null>();
    return doc ? this.toEntity(doc) : null;
  }

  async save(cartItem: CartItem): Promise<CartItem> {
    const doc = await CartItemModel.findByIdAndUpdate(
      cartItem.id,
      {
        _id: cartItem.id,
        userId: cartItem.userId,
        itemId: cartItem.itemId,
        qty: cartItem.qty,
        reservedAt: cartItem.reservedAt,
      },
      { new: true, upsert: true },
    ).lean<CartItemDoc>();
    return this.toEntity(doc);
  }

  async deleteById(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await CartItemModel.findByIdAndDelete(id);
  }

  async deleteByUser(userId: string): Promise<void> {
    await CartItemModel.deleteMany({ userId });
  }

  async aggregateReservedQuantities(): Promise<{ itemId: string; qty: number }[]> {
    const rows = await CartItemModel.aggregate<{ _id: Types.ObjectId; qty: number }>([
      { $group: { _id: '$itemId', qty: { $sum: '$qty' } } },
    ]);
    return rows.map((r) => ({ itemId: r._id.toString(), qty: r.qty }));
  }
}
