import { NextFunction, Request, Response } from 'express';
import { UserRepository } from '../../../domain/user/User.repository.js';

/** Adds the authenticated user id onto the request. */
export interface AuthedRequest extends Request {
  userId?: string;
}

/**
 * Trivial bearer auth for the take-home: the token IS the user id (issued at
 * login). We verify the user still exists and attach `userId` to the request.
 * No passwords, no JWT — deliberately minimal per the brief.
 */
export function authMiddleware(users: UserRepository) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    try {
      const user = await users.findById(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      req.userId = user.id;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
