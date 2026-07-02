import { User } from '../../../domain/user/User.entity.js';
import { UserRepository } from '../../../domain/user/User.repository.js';
import { UserDoc, UserModel } from './schemas.js';

/** Mongoose-backed implementation of the domain UserRepository interface. */
export class MongooseUserRepository implements UserRepository {
  private toEntity(doc: UserDoc): User {
    return new User({ id: doc._id.toString(), name: doc.name });
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<UserDoc | null>();
    return doc ? this.toEntity(doc) : null;
  }

  async findByName(name: string): Promise<User | null> {
    const doc = await UserModel.findOne({ name: name.trim() }).lean<UserDoc | null>();
    return doc ? this.toEntity(doc) : null;
  }

  async save(user: User): Promise<User> {
    const doc = await UserModel.findOneAndUpdate(
      { name: user.name },
      { name: user.name },
      { new: true, upsert: true },
    ).lean<UserDoc>();
    return this.toEntity(doc);
  }
}
