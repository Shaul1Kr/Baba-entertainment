// Pure domain test — no infrastructure needed (see Item.entity.spec.ts).
import { CartItem } from './CartItem.entity.js';
import { DomainError } from '../shared/DomainError.js';

const base = {
  id: 'c1',
  userId: 'u1',
  itemId: 'i1',
  reservedAt: new Date('2026-07-02T00:00:00.000Z'),
};

describe('CartItem entity invariants', () => {
  it('constructs with a positive quantity', () => {
    const cartItem = new CartItem({ ...base, qty: 2 });
    expect(cartItem.qty).toBe(2);
    expect(cartItem.toJSON()).toEqual({ ...base, qty: 2 });
  });

  it('rejects zero quantity', () => {
    expect(() => new CartItem({ ...base, qty: 0 })).toThrow(DomainError);
  });

  it('rejects a negative quantity', () => {
    expect(() => new CartItem({ ...base, qty: -3 })).toThrow(DomainError);
  });

  it('rejects a non-integer quantity', () => {
    expect(() => new CartItem({ ...base, qty: 1.5 })).toThrow(DomainError);
  });
});
