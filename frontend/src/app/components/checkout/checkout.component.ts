import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-t border-edge p-4" *ngIf="cart$ | async as cart">
      <div class="flex items-center justify-between mb-3">
        <span class="text-dim">Total</span>
        <span class="font-head text-2xl font-extrabold text-gold">
          {{ cart.total | currency }}
        </span>
      </div>
      <button
        class="btn-gold w-full"
        [disabled]="cart.lines.length === 0"
        (click)="checkout()"
      >
        Checkout
      </button>
      <p *ngIf="error$ | async as error" class="text-danger text-sm mt-3 text-center">
        {{ error }}
      </p>
    </div>
  `,
})
export class CheckoutComponent {
  private cart = inject(CartService);
  cart$ = this.cart.cart$;
  error$ = this.cart.error$;

  checkout(): void {
    this.cart.checkout();
  }
}
