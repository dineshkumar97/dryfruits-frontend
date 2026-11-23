
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart as CartService, CartItem } from '../../../core/services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart {

  cartItems: CartItem[] = [];

  constructor(private cartService: CartService) {
    this.loadCart();
  }

  loadCart(): void {
    this.cartItems = this.cartService.getCartItems();
  }

  increaseQuantity(item: CartItem): void {
    this.cartService.updateQuantity(
      item.productId,
      item.weight,
      item.quantity + 1
    );

    this.loadCart();
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(
        item.productId,
        item.weight,
        item.quantity - 1
      );

      this.loadCart();
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(
      item.productId,
      item.weight
    );

    this.loadCart();
  }

  get subtotal(): number {
    return this.cartService.getSubtotal();
  }
}
