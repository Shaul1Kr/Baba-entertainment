import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CartLine } from '../../models';
import { CheckoutComponent } from '../checkout/checkout.component';

interface DrawerLine extends CartLine {
  remaining: number;
  error: string | null;
}

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

      <div class="grow overflow-y-auto p-4 flex flex-col gap-3" *ngIf="view$ | async as view">
        <p *ngIf="view.lines.length === 0" class="text-dim text-center mt-10">
          Your cart is empty. Go grab something!
        </p>

        <div
          *ngFor="let line of view.lines"
          class="flex items-center gap-3 bg-card border border-edge rounded-xl p-3"
        >
          <img [src]="line.imageUrl" [alt]="line.name" class="w-14 h-14 rounded-lg object-cover" />
          <div class="grow min-w-0">
            <div class="font-head font-bold text-ink text-sm truncate">{{ line.name }}</div>
            <div class="text-dim text-xs">{{ line.price | currency }} each</div>

            <!-- Quantity stepper (casino-gold theme) -->
            <div class="flex items-center gap-2 mt-2">
              <button
                type="button"
                class="qty-btn"
                aria-label="Decrease quantity"
                (click)="decrease(line)"
              >−</button>
              <span class="font-head font-extrabold text-gold w-6 text-center">{{ line.qty }}</span>
              <button
                type="button"
                class="qty-btn"
                aria-label="Increase quantity"
                [disabled]="line.remaining === 0"
                (click)="increase(line)"
              >+</button>
            </div>

            <!-- Brief inline error (e.g. 409 on increase) -->
            <div *ngIf="line.error" class="text-danger text-xs font-head font-bold mt-1">
              {{ line.error }}
            </div>
          </div>

          <button
            class="text-danger text-sm font-head font-bold hover:underline self-start"
            (click)="remove(line.itemId)"
          >
            Remove
          </button>
        </div>
      </div>

      <app-checkout></app-checkout>
    </aside>
  `,
  styles: [
    `
      .qty-btn {
        width: 1.9rem;
        height: 1.9rem;
        border-radius: 0.6rem;
        font-family: var(--font-head);
        font-weight: 800;
        font-size: 1.1rem;
        line-height: 1;
        color: var(--color-gold);
        background: transparent;
        border: 1px solid var(--color-edge);
        transition: all 0.12s ease;
      }
      .qty-btn:hover:not(:disabled) {
        border-color: var(--color-gold);
        background: rgba(255, 198, 51, 0.12);
      }
      .qty-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CartDrawerComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private cart = inject(CartService);

  // Join cart lines with live remaining stock and any per-line error.
  view$ = combineLatest([this.cart.cart$, this.cart.items$, this.cart.lineError$]).pipe(
    map(([cart, items, lineError]) => {
      const remainingById = new Map(items.map((i) => [i.id, i.remaining]));
      const lines: DrawerLine[] = cart.lines.map((l) => ({
        ...l,
        remaining: remainingById.get(l.itemId) ?? 0,
        error: lineError?.itemId === l.itemId ? lineError.message : null,
      }));
      return { total: cart.total, lines };
    }),
  );

  increase(line: DrawerLine): void {
    this.cart.updateQuantity(line.itemId, 1);
  }

  decrease(line: DrawerLine): void {
    // At qty 1, "−" is a full remove (same confirmation-free behaviour as Remove).
    if (line.qty <= 1) {
      this.cart.removeFromCart(line.itemId);
    } else {
      this.cart.updateQuantity(line.itemId, -1);
    }
  }

  remove(itemId: string): void {
    this.cart.removeFromCart(itemId);
  }
}
