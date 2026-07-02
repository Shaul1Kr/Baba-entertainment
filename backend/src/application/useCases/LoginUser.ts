import { User } from '../../domain/user/User.entity.js';
import { UserRepository } from '../../domain/user/User.repository.js';

export interface LoginUserInput {
  name: string;
}

export interface LoginUserOutput {
  userId: string;
  name: string;
  token: string;
}

/**
 * Logs a user in by name only (no real auth per the brief). If the name is new
 * we create the user; otherwise we reuse it. The "token" is simply the user id
 * used as a bearer credential — deliberately trivial for this take-home.
 */
export class LoginUser {
  constructor(private readonly users: UserRepository) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const name = input.name?.trim();
    // Constructing the entity enforces the "name required" invariant.
    const candidate = new User({ id: 'pending', name });

    const existing = await this.users.findByName(candidate.name);
    const user = existing ?? (await this.users.save(candidate));

    return { userId: user.id, name: user.name, token: user.id };
  }
}
