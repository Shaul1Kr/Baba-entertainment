import { StockBroadcaster } from './application/ports/StockBroadcaster.js';
import { LoginUser } from './application/useCases/LoginUser.js';
import { ListItems } from './application/useCases/ListItems.js';
import { AddToCart } from './application/useCases/AddToCart.js';
import { RemoveFromCart } from './application/useCases/RemoveFromCart.js';
import { GetCart } from './application/useCases/GetCart.js';
import { Checkout } from './application/useCases/Checkout.js';
import { ExpireReservation } from './application/useCases/ExpireReservation.js';
import { MongooseItemRepository } from './infrastructure/persistence/mongoose/ItemRepository.js';
import { MongooseCartItemRepository } from './infrastructure/persistence/mongoose/CartItemRepository.js';
import { MongooseOrderRepository } from './infrastructure/persistence/mongoose/OrderRepository.js';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose/UserRepository.js';
import { StockReservationService } from './infrastructure/redis/StockReservationService.js';
import { AuthController } from './interfaces/http/controllers/AuthController.js';
import { ItemsController } from './interfaces/http/controllers/ItemsController.js';
import { CartController } from './interfaces/http/controllers/CartController.js';
import { CheckoutController } from './interfaces/http/controllers/CheckoutController.js';
import { ControllerBundle } from './interfaces/http/routes.js';

/**
 * Composition root: constructs repositories, use cases, and controllers and
 * wires their dependencies. This is the ONLY place concrete implementations are
 * bound to the interfaces the inner layers depend on.
 */
export function composeApp(deps: {
  stock: StockReservationService;
  broadcaster: StockBroadcaster;
}) {
  // Repositories (infrastructure) satisfying domain interfaces.
  const users = new MongooseUserRepository();
  const items = new MongooseItemRepository();
  const cart = new MongooseCartItemRepository();
  const orders = new MongooseOrderRepository();

  // Use cases (application) — one per action.
  const loginUser = new LoginUser(users);
  const listItems = new ListItems(items, deps.stock);
  const addToCart = new AddToCart(items, cart, deps.stock, deps.broadcaster);
  const removeFromCart = new RemoveFromCart(cart, deps.stock, deps.broadcaster);
  const getCart = new GetCart(cart, items);
  const checkout = new Checkout(cart, items, orders, deps.stock, deps.broadcaster);
  const expireReservation = new ExpireReservation(cart, deps.stock, deps.broadcaster);

  // Controllers (interface) — thin.
  const controllers: ControllerBundle = {
    auth: new AuthController(loginUser),
    items: new ItemsController(listItems),
    cart: new CartController(addToCart, removeFromCart, getCart),
    checkout: new CheckoutController(checkout),
  };

  return {
    repositories: { users, items, cart, orders },
    useCases: { expireReservation },
    controllers,
  };
}
