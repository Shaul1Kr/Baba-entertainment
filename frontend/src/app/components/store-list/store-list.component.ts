import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ItemCardComponent } from '../item-card/item-card.component';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, ItemCardComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <app-item-card *ngFor="let item of items$ | async" [item]="item"></app-item-card>
      </div>

      <!-- Pagination controls -->
      <nav
        *ngIf="pageState$ | async as p"
        class="flex flex-wrap items-center justify-center gap-2 mt-8"
        aria-label="Pagination"
      >
        <button
          class="page-btn"
          [disabled]="p.page <= 1"
          (click)="go(p.page - 1)"
          aria-label="Previous page"
        >
          ‹ Prev
        </button>

        <button
          *ngFor="let n of pages(p.totalPages)"
          class="page-btn"
          [class.page-active]="n === p.page"
          [attr.aria-current]="n === p.page ? 'page' : null"
          (click)="go(n)"
        >
          {{ n }}
        </button>

        <button
          class="page-btn"
          [disabled]="p.page >= p.totalPages"
          (click)="go(p.page + 1)"
          aria-label="Next page"
        >
          Next ›
        </button>

        <span class="text-dim text-sm w-full text-center mt-2">
          Page {{ p.page }} of {{ p.totalPages }} · {{ p.total }} items
        </span>
      </nav>
    </div>
  `,
  styles: [
    `
      .page-btn {
        min-width: 2.4rem;
        height: 2.4rem;
        padding: 0 0.6rem;
        border-radius: 0.6rem;
        font-family: var(--font-head);
        font-weight: 700;
        color: var(--color-dim);
        background: transparent;
        border: 1px solid var(--color-edge);
        transition: all 0.12s ease;
      }
      .page-btn:hover:not(:disabled):not(.page-active) {
        color: var(--color-ink);
        border-color: var(--color-gold);
      }
      .page-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .page-active {
        color: #201400;
        background: linear-gradient(180deg, var(--color-gold), var(--color-gold-deep));
        border-color: transparent;
        box-shadow: var(--shadow-glow);
      }
    `,
  ],
})
export class StoreListComponent {
  private cart = inject(CartService);
  items$ = this.cart.items$;
  pageState$ = this.cart.pageState$;

  pages(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  go(page: number): void {
    this.cart.goToPage(page);
    // Scroll back to the top of the list on page change.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
