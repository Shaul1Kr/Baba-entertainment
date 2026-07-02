// Pure domain test: the Item entity has ZERO infra dependencies, so this runs
// with no DB, no Redis, no network — instant and deterministic. That's the whole
// point of keeping invariants in the domain layer.
import { Item } from './Item.entity.js';
import { DomainError } from '../shared/DomainError.js';

const valid = {
  id: 'i1',
  name: 'High Roller Watch',
  description: 'Amber dial',
  price: 299.5,
  imageUrl: 'http://x/y.png',
  totalStock: 3,
};

describe('Item entity invariants', () => {
  it('constructs a valid item and exposes its stock', () => {
    const item = new Item(valid);
    expect(item.totalStock).toBe(3);
    expect(item.toJSON()).toEqual(valid);
  });

  it('rejects negative stock', () => {
    expect(() => new Item({ ...valid, totalStock: -1 })).toThrow(DomainError);
  });

  it('rejects non-integer stock', () => {
    expect(() => new Item({ ...valid, totalStock: 2.5 })).toThrow(DomainError);
  });

  it('rejects a negative price', () => {
    expect(() => new Item({ ...valid, price: -0.01 })).toThrow(DomainError);
  });

  it('rejects an empty name', () => {
    expect(() => new Item({ ...valid, name: '   ' })).toThrow(DomainError);
  });
});
