import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { Cart, Item, Order, Session } from '../models';

const EMPTY_CART: Cart = { lines: [], total: 0 };

/**
 * The single source of UI truth. Holds session, catalogue, and cart state in
 * BehaviorSubjects (no NgRx — deliberately lean for this app's size) and
 * orchestrates the API + live socket updates.
 *
 * Live stock: it subscribes to `stock:update` and patches the matching item's
 * `remaining` in place, so every browser reflects reservations instantly.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private api = inject(ApiService);
  private socket = inject(SocketService);

  private sessionSubject = new BehaviorSubject<Session | null>(this.restoreSession());
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  private cartSubject = new BehaviorSubject<Cart>(EMPTY_CART);
  private orderSubject = new BehaviorSubject<Order | null>(null);
  private errorSubject = new BehaviorSubject<string | null>(null);

  readonly session$: Observable<Session | null> = this.sessionSubject.asObservable();
  readonly items$: Observable<Item[]> = this.itemsSubject.asObservable();
  readonly cart$: Observable<Cart> = this.cartSubject.asObservable();
  readonly lastOrder$: Observable<Order | null> = this.orderSubject.asObservable();
  readonly error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor() {
    // Live stock updates from the server patch item remaining in place.
    this.socket.onStockUpdate().subscribe(({ itemId, remaining }) => {
      const items = this.itemsSubject.value.map((it) =>
        it.id === itemId ? { ...it, remaining } : it,
      );
      this.itemsSubject.next(items);
    });
  }

  get session(): Session | null {
    return this.sessionSubject.value;
  }

  // ---- session ----
  private restoreSession(): Session | null {
    const raw = localStorage.getItem('session');
    return raw ? (JSON.parse(raw) as Session) : null;
  }

  login(name: string): void {
    this.errorSubject.next(null);
    this.api.login(name).subscribe({
      next: (session) => {
        localStorage.setItem('session', JSON.stringify(session));
        localStorage.setItem('token', session.token);
        this.sessionSubject.next(session);
        this.loadItems();
        this.refreshCart();
      },
      error: () => this.errorSubject.next('Could not log in. Is the backend running?'),
    });
  }

  logout(): void {
    localStorage.removeItem('session');
    localStorage.removeItem('token');
    this.sessionSubject.next(null);
    this.cartSubject.next(EMPTY_CART);
    this.orderSubject.next(null);
  }

  // ---- catalogue ----
  loadItems(): void {
    this.api.getItems().subscribe({
      next: (items) => this.itemsSubject.next(items),
      error: () => this.errorSubject.next('Could not load items.'),
    });
  }

  // ---- cart ----
  refreshCart(): void {
    this.api.getCart().subscribe({
      next: (cart) => this.cartSubject.next(cart),
      error: () => {},
    });
  }

  addToCart(item: Item): void {
    this.errorSubject.next(null);
    this.api.addToCart(item.id, 1).subscribe({
      next: () => this.refreshCart(),
      error: (err) => {
        if (err?.status === 409) {
          this.errorSubject.next(`"${item.name}" just sold out!`);
        } else {
          this.errorSubject.next('Could not add to cart.');
        }
        // Re-sync in case another client changed stock.
        this.loadItems();
      },
    });
  }

  removeFromCart(itemId: string): void {
    this.api.removeFromCart(itemId).subscribe({
      next: () => this.refreshCart(),
      error: () => this.errorSubject.next('Could not remove item.'),
    });
  }

  checkout(): void {
    this.errorSubject.next(null);
    this.api.checkout().subscribe({
      next: (order) => {
        this.orderSubject.next(order);
        this.cartSubject.next(EMPTY_CART);
      },
      error: (err) => {
        this.errorSubject.next(
          err?.error?.error ?? 'Checkout failed. Please try again.',
        );
      },
    });
  }

  clearOrder(): void {
    this.orderSubject.next(null);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }
}
