
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart as CartService, CartItem } from '../../../core/services/cart';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart {

  cartItems: CartItem[] = [];

  stockError = '';

  constructor(private cartService: CartService) {
    this.loadCart();
  }

  // Load cart and validate current stock
  loadCart(): void {

    this.cartItems = this.cartService.getCartItems();

    const validation = this.cartService.validateCart();

    this.stockError = validation.success
      ? ''
      : validation.message;
  }

  // Increase quantity
  increaseQuantity(item: CartItem): void {

    const result = this.cartService.updateQuantity(
      item.productId,
      item.weight,
      item.quantity + 1
    );

    if (!result.success) {
      this.stockError = result.message;
      return;
    }

    this.stockError = '';
    this.loadCart();
  }

  // Decrease quantity
  decreaseQuantity(item: CartItem): void {

    if (item.quantity > 1) {

      const result = this.cartService.updateQuantity(
        item.productId,
        item.weight,
        item.quantity - 1
      );

      if (!result.success) {
        this.stockError = result.message;
        return;
      }

      this.stockError = '';
      this.loadCart();
    }
  }

  // Remove item
  removeItem(item: CartItem): void {

    this.cartService.removeItem(
      item.productId,
      item.weight
    );

    this.stockError = '';
    this.loadCart();
  }

  // Subtotal
  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  // Total quantity
  get totalQuantity(): number {
    return this.cartService.getTotalQuantity();
  }

  // Total savings
  get totalSavings(): number {
    return this.cartItems.reduce(
      (total, item) =>
        total + (item.oldPrice - item.price) * item.quantity,
      0
    );
  }

}
