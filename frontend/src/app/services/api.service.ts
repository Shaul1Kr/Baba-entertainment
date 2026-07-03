import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../config';
import { Cart, Item, Order, Session } from '../models';

/**
 * Thin wrapper over the backend REST API. No state here — just HTTP calls.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  login(name: string): Observable<Session> {
    return this.http.post<Session>(`${API_BASE}/auth/login`, { name });
  }

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${API_BASE}/items`);
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${API_BASE}/cart`);
  }

  addToCart(itemId: string, qty = 1): Observable<{ cartItemId: string; remaining: number }> {
    return this.http.post<{ cartItemId: string; remaining: number }>(
      `${API_BASE}/cart/add`,
      { itemId, qty },
    );
  }

  removeFromCart(itemId: string): Observable<{ remaining: number }> {
    return this.http.post<{ remaining: number }>(`${API_BASE}/cart/remove`, { itemId });
  }

  updateQuantity(
    itemId: string,
    delta: number,
  ): Observable<{ itemId: string; qty: number; remaining: number }> {
    return this.http.patch<{ itemId: string; qty: number; remaining: number }>(
      `${API_BASE}/cart/update`,
      { itemId, delta },
    );
  }

  checkout(): Observable<Order> {
    return this.http.post<Order>(`${API_BASE}/checkout`, {});
  }
}
