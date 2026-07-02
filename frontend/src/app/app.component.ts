import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { CartService } from './services/cart.service';
import { LoginComponent } from './components/login/login.component';
import { StoreListComponent } from './components/store-list/store-list.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { OrderConfirmationComponent } from './components/order-confirmation/order-confirmation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    StoreListComponent,
    CartDrawerComponent,
    OrderConfirmationComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private cart = inject(CartService);

  session$ = this.cart.session$;
  order$ = this.cart.lastOrder$;
  error$ = this.cart.error$;
  cartCount$ = this.cart.cart$.pipe(
    map((c) => c.lines.reduce((n, l) => n + l.qty, 0)),
  );

  drawerOpen = signal(false);

  ngOnInit(): void {
    // If a session was restored from localStorage, load the store immediately.
    if (this.cart.session) {
      this.cart.loadItems();
      this.cart.refreshCart();
    }
  }

  logout(): void {
    this.cart.logout();
  }
}
