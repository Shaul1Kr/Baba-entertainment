import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ItemCardComponent } from '../item-card/item-card.component';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, ItemCardComponent],
  template: `
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto px-4 py-6"
    >
      <app-item-card *ngFor="let item of items$ | async" [item]="item"></app-item-card>
    </div>
  `,
})
export class StoreListComponent {
  private cart = inject(CartService);
  items$ = this.cart.items$;
}
