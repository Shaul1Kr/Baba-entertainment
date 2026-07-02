import { DomainError } from '../shared/DomainError.js';

export interface UserProps {
  id: string;
  name: string;
}

/**
 * A User is identified by a name only (the brief specifies no real auth).
 * Pure domain entity enforcing that a name is present.
 */
export class User {
  readonly id: string;
  readonly name: string;

  constructor(props: UserProps) {
    if (!props.name || props.name.trim() === '') {
      throw new DomainError('User name is required');
    }
    this.id = props.id;
    this.name = props.name.trim();
  }

  toJSON(): UserProps {
    return { id: this.id, name: this.name };
  }
}
