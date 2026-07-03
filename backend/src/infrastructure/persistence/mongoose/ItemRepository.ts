import { Item } from '../../../domain/item/Item.entity.js';
import { ItemRepository, Page } from '../../../domain/item/Item.repository.js';
import { ItemDoc, ItemModel } from './schemas.js';

/** Mongoose-backed implementation of the domain ItemRepository interface. */
export class MongooseItemRepository implements ItemRepository {
  private toEntity(doc: ItemDoc): Item {
    return new Item({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      price: doc.price,
      imageUrl: doc.imageUrl,
      totalStock: doc.totalStock,
    });
  }

  async findAll(): Promise<Item[]> {
    const docs = await ItemModel.find().lean<ItemDoc[]>();
    return docs.map((d) => this.toEntity(d));
  }

  /**
   * One page via skip/limit + a separate countDocuments. Two round trips, but
   * both are trivially fast at this catalogue size and it reads far clearer than
   * a $facet aggregation (see ARCHITECTURE.md). Sorted by _id (insertion order)
   * so paging is stable and deterministic.
   */
  async findPage(page: number, limit: number): Promise<Page<Item>> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      ItemModel.find().sort({ _id: 1 }).skip(skip).limit(limit).lean<ItemDoc[]>(),
      ItemModel.countDocuments(),
    ]);
    return { items: docs.map((d) => this.toEntity(d)), total };
  }

  async findById(id: string): Promise<Item | null> {
    const doc = await ItemModel.findById(id).lean<ItemDoc | null>();
    return doc ? this.toEntity(doc) : null;
  }

  async save(item: Item): Promise<Item> {
    const doc = await ItemModel.findByIdAndUpdate(
      item.id,
      {
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        totalStock: item.totalStock,
      },
      { new: true, upsert: true },
    ).lean<ItemDoc>();
    return this.toEntity(doc);
  }
}
