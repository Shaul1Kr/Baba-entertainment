/**
 * Application-layer PORT for structured logging.
 *
 * Use cases depend on THIS interface, injected via their constructor (same
 * pattern as StockBroadcaster) — they never import the concrete pino singleton.
 * This keeps the DDD dependency direction intact (application knows nothing of
 * infrastructure) and makes use cases trivially testable with a stub logger.
 *
 * The signatures are a structural subset of pino's, so the real pino instance
 * satisfies this interface directly.
 */
export interface Logger {
  info(obj: object, msg?: string): void;
  info(msg: string): void;
  debug(obj: object, msg?: string): void;
  debug(msg: string): void;
  warn(obj: object, msg?: string): void;
  warn(msg: string): void;
  error(obj: object, msg?: string): void;
  error(msg: string): void;
  child(bindings: Record<string, unknown>): Logger;
}
