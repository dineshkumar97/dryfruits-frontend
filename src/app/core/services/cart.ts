
import { Injectable,signal } from '@angular/core';
export interface CartItem {
  productId: number;
  name: string;
  image: string;
  category: string;
  weight: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class Cart {
cartCount = signal(0);
  private readonly storageKey = 'nutnest-cart';

  private items: CartItem[] = this.loadCart();
constructor() {
  this.cartCount.set(this.getCartCount());
}
  getCartItems(): CartItem[] {
    return [...this.items];
  }

  addToCart(item: CartItem): void {
    const existingItem = this.items.find(
      product =>
        product.productId === item.productId &&
        product.weight === item.weight
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }

    this.saveCart();
  }

  updateQuantity(
    productId: number,
    weight: string,
    quantity: number
  ): void {
    const item = this.items.find(
      product =>
        product.productId === productId &&
        product.weight === weight
    );

    if (item && quantity > 0) {
      item.quantity = quantity;
      this.saveCart();
    }
  }

  removeItem(productId: number, weight: string): void {
    this.items = this.items.filter(
      product =>
        !(product.productId === productId &&
          product.weight === weight)
    );

    this.saveCart();
  }

  getCartCount(): number {
    return this.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  getSubtotal(): number {
    return this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  clearCart(): void {
    this.items = [];
    this.saveCart();
  }

  private saveCart(): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.items)
    );

  this.cartCount.set(this.getCartCount());
  }

  private loadCart(): CartItem[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) || '[]'
      );
    } catch {
      return [];
    }
  }
}
