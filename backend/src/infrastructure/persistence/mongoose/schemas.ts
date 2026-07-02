import { Schema, model, Types } from 'mongoose';

// ---- Item ----
export interface ItemDoc {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  totalStock: number;
}

const itemSchema = new Schema<ItemDoc>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: '' },
  totalStock: { type: Number, required: true, min: 0 },
});

export const ItemModel = model<ItemDoc>('Item', itemSchema);

// ---- CartItem ----
export interface CartItemDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  qty: number;
  reservedAt: Date;
}

const cartItemSchema = new Schema<CartItemDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  qty: { type: Number, required: true, min: 1 },
  reservedAt: { type: Date, required: true, default: () => new Date() },
});

export const CartItemModel = model<CartItemDoc>('CartItem', cartItemSchema);

// ---- Order ----
export interface OrderDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: { itemId: Types.ObjectId; qty: number; price: number }[];
  total: number;
  createdAt: Date;
}

const orderSchema = new Schema<OrderDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [
    {
      _id: false,
      itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
      qty: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
    },
  ],
  total: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, required: true, default: () => new Date() },
});

export const OrderModel = model<OrderDoc>('Order', orderSchema);

// ---- User ----
export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
}

const userSchema = new Schema<UserDoc>({
  name: { type: String, required: true, unique: true },
});

export const UserModel = model<UserDoc>('User', userSchema);
