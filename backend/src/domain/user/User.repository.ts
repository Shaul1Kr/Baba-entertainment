import { User } from './User.entity.js';

/**
 * Repository INTERFACE for users. Domain-layer only.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
