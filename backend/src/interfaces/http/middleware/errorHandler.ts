import { NextFunction, Request, Response } from 'express';
import { DomainError, OutOfStockError } from '../../../domain/shared/DomainError.js';
import { logger } from '../../../infrastructure/logging/logger.js';

/**
 * Central error handler. Maps domain errors to HTTP status codes so controllers
 * can stay thin and never build error responses themselves.
 *  - OutOfStockError -> 409 (the oversell guard rejecting a reservation)
 *  - other DomainError -> 400 (invariant / validation violation)
 *  - anything else -> 500
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof OutOfStockError) {
    res.status(409).json({ error: err.message, code: 'OUT_OF_STOCK' });
    return;
  }
  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message, code: 'BAD_REQUEST' });
    return;
  }
  // Unexpected error: log with the request-scoped logger (carries the request
  // id from pino-http) plus route context. We log the error object so pino
  // serializes the stack — but never the request body or auth headers.
  const log = (req as Request & { log?: typeof logger }).log ?? logger;
  log.error({ err, method: req.method, path: req.path }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
