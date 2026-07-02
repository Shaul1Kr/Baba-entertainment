import { Router } from 'express';
import { UserRepository } from '../../domain/user/User.repository.js';
import { asyncHandler } from './asyncHandler.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { AuthController } from './controllers/AuthController.js';
import { ItemsController } from './controllers/ItemsController.js';
import { CartController } from './controllers/CartController.js';
import { CheckoutController } from './controllers/CheckoutController.js';

export interface ControllerBundle {
  auth: AuthController;
  items: ItemsController;
  cart: CartController;
  checkout: CheckoutController;
}

/**
 * Wires the HTTP surface. Public route: /auth/login. Everything else requires a
 * bearer token. Controllers are thin; this file only maps verbs+paths to them.
 */
export function buildRoutes(
  controllers: ControllerBundle,
  users: UserRepository,
): Router {
  const router = Router();
  const requireAuth = authMiddleware(users);

  router.post('/auth/login', asyncHandler(controllers.auth.login));

  router.get('/items', asyncHandler(controllers.items.list));

  router.get('/cart', requireAuth, asyncHandler(controllers.cart.get));
  router.post('/cart/add', requireAuth, asyncHandler(controllers.cart.add));
  router.post('/cart/remove', requireAuth, asyncHandler(controllers.cart.remove));

  router.post('/checkout', requireAuth, asyncHandler(controllers.checkout.create));

  return router;
}
