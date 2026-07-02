import { Item } from '../../../domain/item/Item.entity.js';
import { ItemRepository } from '../../../domain/item/Item.repository.js';
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
