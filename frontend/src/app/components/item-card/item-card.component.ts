import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { Item } from '../../models';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="slot-tile flex flex-col">
      <div
        class="relative h-44 flex items-center justify-center"
        style="background: linear-gradient(135deg, #23232f, #14141c);"
      >
        <span class="absolute text-5xl opacity-30 select-none">🎁</span>
        <img
          [src]="item.imageUrl"
          [alt]="item.name"
          class="relative w-full h-44 object-cover"
          (error)="hideBroken($event)"
        />
        <!-- Live jackpot-style stock pill that shifts colour as it depletes -->
        <span
          class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-head font-bold
                 backdrop-blur border"
          [ngClass]="pillClass()"
        >
          {{ item.remaining > 0 ? item.remaining + ' left' : 'SOLD OUT' }}
        </span>
      </div>

      <div class="p-4 flex flex-col gap-2 grow">
        <h3 class="font-head text-lg font-bold text-ink">{{ item.name }}</h3>
        <p class="text-dim text-sm grow">{{ item.description }}</p>
        <div class="flex items-center justify-between mt-2">
          <span class="font-head text-2xl font-extrabold text-gold">
            {{ item.price | currency }}
          </span>
          <button
            class="btn-gold"
            [disabled]="item.remaining === 0"
            (click)="add()"
          >
            {{ item.remaining === 0 ? 'Gone' : 'Grab it' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ItemCardComponent {
  @Input({ required: true }) item!: Item;
  private cart = inject(CartService);

  add(): void {
    this.cart.addToCart(this.item);
  }

  /** Hide a broken image so the gradient + emoji placeholder shows through. */
  hideBroken(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  /** Green -> amber -> red as the counter drains, like a live jackpot meter. */
  pillClass(): string {
    const r = this.item.remaining;
    if (r === 0) return 'bg-black/60 text-dim border-edge';
    if (r <= 3) return 'bg-danger/15 text-danger border-danger/40';
    if (r <= 8) return 'bg-amber/15 text-amber border-amber/40';
    return 'bg-success/15 text-success border-success/40';
  }
}
