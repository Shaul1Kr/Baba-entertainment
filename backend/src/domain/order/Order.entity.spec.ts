// Pure domain test — no infrastructure needed (see Item.entity.spec.ts).
import { Order } from './Order.entity.js';
import { DomainError } from '../shared/DomainError.js';

describe('Order entity invariants', () => {
  it('derives the total from its line items (qty × price)', () => {
    const order = Order.create({
      id: 'o1',
      userId: 'u1',
      items: [
        { itemId: 'a', qty: 2, price: 39.99 }, // 79.98
        { itemId: 'b', qty: 1, price: 19.99 }, // 19.99
      ],
    });
    expect(order.total).toBeCloseTo(99.97, 2);
  });

  it('cannot drift: the total always reflects the lines, not an arbitrary input', () => {
    const items = [
      { itemId: 'a', qty: 3, price: 10 },
      { itemId: 'b', qty: 2, price: 5 },
    ];
    const order = Order.create({ id: 'o2', userId: 'u1', items });
    const expected = items.reduce((sum, l) => sum + l.qty * l.price, 0);
    expect(order.total).toBe(expected); // 40
  });

  it('rejects an order with no line items', () => {
    expect(() => Order.create({ id: 'o3', userId: 'u1', items: [] })).toThrow(
      DomainError,
    );
  });
});
