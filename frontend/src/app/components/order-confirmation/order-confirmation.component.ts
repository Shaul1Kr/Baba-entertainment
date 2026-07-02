import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css',
})
export class OrderConfirmationComponent {
  private cart = inject(CartService);
  order$ = this.cart.lastOrder$;

  // Join the order lines with the catalogue so we can show item names.
  view$ = combineLatest([this.cart.lastOrder$, this.cart.items$]).pipe(
    map(([order, items]) => {
      if (!order) return null;
      const nameById = new Map(items.map((i) => [i.id, i.name]));
      return {
        orderId: order.orderId,
        total: order.total,
        lines: order.items.map((l) => ({
          name: nameById.get(l.itemId) ?? 'Item',
          qty: l.qty,
          subtotal: l.price * l.qty,
        })),
      };
    }),
  );

  // A fixed set of coins for the CSS burst animation.
  coins = Array.from({ length: 14 }, (_, i) => i);

  backToStore(): void {
    this.cart.clearOrder();
    this.cart.loadItems();
  }
}
