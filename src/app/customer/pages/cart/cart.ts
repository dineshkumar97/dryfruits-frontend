
import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import {
  Cart as CartService,
  CartItem
} from '../../../core/services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart {

  // Cart state
  cartItems = signal<CartItem[]>([]);

  stockError = signal('');

  constructor(private cartService: CartService) {
    this.loadCart();
  }

  // Cart summary using computed signals
  totalQuantity = computed(() =>
    this.cartItems().reduce(
      (total, item) => total + item.quantity,
      0
    )
  );

  subtotal = computed(() =>
    this.cartItems().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  );

  totalSavings = computed(() =>
    this.cartItems().reduce(
      (total, item) =>
        total + (item.oldPrice - item.price) * item.quantity,
      0
    )
  );

  // Load cart and validate stock
  loadCart(): void {
    this.cartItems.set(this.cartService.getCartItems());

    const validation = this.cartService.validateCart();

    this.stockError.set(
      validation.success ? '' : validation.message
    );
  }

  // Available stock
  getAvailableStock(item: CartItem): number {
    return this.cartService.getAvailableQuantity(
      item.productId,
      item.weight
    );
  }

  // Stock status
  getStockStatus(item: CartItem): string {
    const available = this.getAvailableStock(item);

    if (available <= 0) return 'Out of Stock';
    if (available <= 5) return 'Limited Stock';

    return 'In Stock';
  }

  // Increase quantity
  increaseQuantity(item: CartItem): void {
    const result = this.cartService.updateQuantity(
      item.productId,
      item.weight,
      item.quantity + 1
    );

    if (!result.success) {
      this.stockError.set(result.message);
      return;
    }

    this.loadCart();
  }

  // Decrease quantity
  decreaseQuantity(item: CartItem): void {
    if (item.quantity <= 1) return;

    const result = this.cartService.updateQuantity(
      item.productId,
      item.weight,
      item.quantity - 1
    );

    if (!result.success) {
      this.stockError.set(result.message);
      return;
    }

    this.loadCart();
  }

  // Remove item
  removeItem(item: CartItem): void {
    this.cartService.removeItem(
      item.productId,
      item.weight
    );

    this.loadCart();
  }
}
