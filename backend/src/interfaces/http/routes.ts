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

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Log in with a name (creates the user if new). No real auth.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/LoginRequest' }
   *     responses:
   *       200:
   *         description: Session with a bearer token (the token is the user id).
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Session' }
   *       400:
   *         description: Missing/invalid name.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  router.post('/auth/login', asyncHandler(controllers.auth.login));

  /**
   * @openapi
   * /items:
   *   get:
   *     tags: [Items]
   *     summary: List the catalogue with LIVE remaining stock (from Redis).
   *     responses:
   *       200:
   *         description: Array of items.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items: { $ref: '#/components/schemas/Item' }
   */
  router.get('/items', asyncHandler(controllers.items.list));

  /**
   * @openapi
   * /cart:
   *   get:
   *     tags: [Cart]
   *     summary: Get the current user's cart (reservation rows grouped per item).
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: The cart.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Cart' }
   *       401:
   *         description: Missing/invalid bearer token.
   */
  router.get('/cart', requireAuth, asyncHandler(controllers.cart.get));

  /**
   * @openapi
   * /cart/add:
   *   post:
   *     tags: [Cart]
   *     summary: Reserve stock and add an item to the cart (atomic, oversell-safe).
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/AddToCartRequest' }
   *     responses:
   *       200:
   *         description: Reserved. Returns the cart item id and live remaining stock.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/AddToCartResponse' }
   *       409:
   *         description: Out of stock — the atomic reservation was rejected.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Missing/invalid bearer token.
   */
  router.post('/cart/add', requireAuth, asyncHandler(controllers.cart.add));

  /**
   * @openapi
   * /cart/remove:
   *   post:
   *     tags: [Cart]
   *     summary: Remove an item from the cart; returns its reserved stock immediately.
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/RemoveFromCartRequest' }
   *     responses:
   *       200:
   *         description: Removed. Returns the live remaining stock.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/RemoveFromCartResponse' }
   *       401:
   *         description: Missing/invalid bearer token.
   */
  router.post('/cart/remove', requireAuth, asyncHandler(controllers.cart.remove));

  /**
   * @openapi
   * /cart/update:
   *   patch:
   *     tags: [Cart]
   *     summary: Adjust an item's cart quantity by a signed delta (atomic, oversell-safe).
   *     description: >
   *       delta is a signed non-zero integer. Increase (+N) reserves N more units
   *       through the same atomic Lua path as add-to-cart; decrease (-N) releases N
   *       back. Reaching qty 0 removes the item from the cart.
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/UpdateCartRequest' }
   *     responses:
   *       200:
   *         description: Updated. Returns the item's new cart qty and live remaining stock.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/UpdateCartResponse' }
   *       400:
   *         description: delta missing, zero, or not an integer.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       409:
   *         description: Not enough stock to increase — cart unchanged.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Missing/invalid bearer token.
   */
  router.patch('/cart/update', requireAuth, asyncHandler(controllers.cart.update));

  /**
   * @openapi
   * /checkout:
   *   post:
   *     tags: [Checkout]
   *     summary: Convert the cart's reservations into an Order and clear the cart.
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201:
   *         description: Order created.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Order' }
   *       400:
   *         description: Cart is empty.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Missing/invalid bearer token.
   */
  router.post('/checkout', requireAuth, asyncHandler(controllers.checkout.create));

  return router;
}
