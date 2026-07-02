import { Item } from './Item.entity.js';

/**
 * Repository INTERFACE for Items. Lives in the domain layer and depends on
 * nothing but the domain entity. The Mongoose implementation lives in
 * infrastructure/persistence/mongoose/ItemRepository.ts.
 */
export interface ItemRepository {
  findAll(): Promise<Item[]>;
  findById(id: string): Promise<Item | null>;
  save(item: Item): Promise<Item>;
}
