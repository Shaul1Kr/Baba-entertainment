/**
 * Base class for domain-invariant violations. The domain layer throws these;
 * the HTTP layer maps them to status codes. Keeping a dedicated type means the
 * domain never needs to know about Express or HTTP.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Thrown when a requested stock reservation cannot be satisfied. */
export class OutOfStockError extends DomainError {
  constructor(itemId: string) {
    super(`Item ${itemId} is out of stock`);
  }
}
