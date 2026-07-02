import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="slot-tile w-full max-w-md p-8 text-center">
        <div class="text-5xl mb-2">🎰</div>
        <h1 class="font-head text-3xl font-extrabold text-gold">JACKPOT DROP</h1>
        <p class="text-dim mt-2 mb-6">
          Flash sale in progress. Limited stock — when it’s gone, it’s gone.
        </p>

        <form (ngSubmit)="submit()" class="flex flex-col gap-3">
          <input
            [(ngModel)]="name"
            name="name"
            placeholder="Enter your name"
            autocomplete="off"
            class="bg-bg-elev border border-edge rounded-xl px-4 py-3 text-ink
                   placeholder:text-dim outline-none focus:border-gold transition"
          />
          <button type="submit" class="btn-gold w-full" [disabled]="!name.trim()">
            Let me in
          </button>
        </form>

        <p *ngIf="error$ | async as error" class="text-danger mt-4 text-sm">{{ error }}</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private cart = inject(CartService);
  name = '';
  error$ = this.cart.error$;

  submit(): void {
    if (this.name.trim()) this.cart.login(this.name.trim());
  }
}
