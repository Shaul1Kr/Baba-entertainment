// Pure domain test — no infrastructure needed (see Item.entity.spec.ts).
import { User } from './User.entity.js';
import { DomainError } from '../shared/DomainError.js';

describe('User entity invariants', () => {
  it('constructs with a name and trims surrounding whitespace', () => {
    const user = new User({ id: 'u1', name: '  Alice  ' });
    expect(user.name).toBe('Alice');
  });

  it('rejects an empty name', () => {
    expect(() => new User({ id: 'u2', name: '' })).toThrow(DomainError);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => new User({ id: 'u3', name: '   ' })).toThrow(DomainError);
  });
});
