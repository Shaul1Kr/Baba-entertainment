export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  remaining: number;
}

export interface CartLine {
  itemId: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}

export interface Cart {
  lines: CartLine[];
  total: number;
}

export interface Session {
  userId: string;
  name: string;
  token: string;
}

export interface OrderLine {
  itemId: string;
  qty: number;
  price: number;
}

export interface Order {
  orderId: string;
  total: number;
  items: OrderLine[];
}

export interface StockUpdate {
  itemId: string;
  remaining: number;
}
