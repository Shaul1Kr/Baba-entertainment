import { Item } from './Item.entity.js';

/**
 * Repository INTERFACE for Items. Lives in the domain layer and depends on
 * nothing but the domain entity. The Mongoose implementation lives in
 * infrastructure/persistence/mongoose/ItemRepository.ts.
 */
export interface Page<T> {
  items: T[];
  total: number;
}

export interface ItemRepository {
  /** All items — used by startup stock reconciliation. */
  findAll(): Promise<Item[]>;
  /** One page of items (1-based) plus the total count for pagination. */
  findPage(page: number, limit: number): Promise<Page<Item>>;
  findById(id: string): Promise<Item | null>;
  save(item: Item): Promise<Item>;
}
