import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CheckoutComponent } from '../checkout/checkout.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, CheckoutComponent],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/60 transition-opacity z-40"
      [ngClass]="open ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      (click)="close.emit()"
    ></div>

    <!-- Slide-over panel -->
    <aside
      class="fixed top-0 right-0 h-full w-full sm:w-96 bg-bg-elev border-l border-edge
             z-50 flex flex-col transition-transform duration-300"
      [ngClass]="open ? 'translate-x-0' : 'translate-x-full'"
    >
      <header class="flex items-center justify-between p-4 border-b border-edge">
        <h2 class="font-head text-xl font-bold text-ink">Your Cart</h2>
        <button class="btn-ghost" (click)="close.emit()">Close</button>
      </header>

      <div class="grow overflow-y-auto p-4 flex flex-col gap-3" *ngIf="cart$ | async as cart">
        <p *ngIf="cart.lines.length === 0" class="text-dim text-center mt-10">
          Your cart is empty. Go grab something!
        </p>

        <div
          *ngFor="let line of cart.lines"
          class="flex items-center gap-3 bg-card border border-edge rounded-xl p-3"
        >
          <img [src]="line.imageUrl" [alt]="line.name" class="w-14 h-14 rounded-lg object-cover" />
          <div class="grow">
            <div class="font-head font-bold text-ink text-sm">{{ line.name }}</div>
            <div class="text-dim text-xs">
              {{ line.qty }} × {{ line.price | currency }}
            </div>
          </div>
          <button
            class="text-danger text-sm font-head font-bold hover:underline"
            (click)="remove(line.itemId)"
          >
            Remove
          </button>
        </div>
      </div>

      <app-checkout></app-checkout>
    </aside>
  `,
})
export class CartDrawerComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private cart = inject(CartService);
  cart$ = this.cart.cart$;

  remove(itemId: string): void {
    this.cart.removeFromCart(itemId);
  }
}
