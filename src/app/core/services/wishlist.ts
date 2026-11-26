import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product';

@Injectable({
  providedIn: 'root'
})
export class Wishlist {

  private wishlistItems = signal<Product[]>([]);

  products = this.wishlistItems.asReadonly();

  wishlistCount = computed(() => this.wishlistItems().length);

  isInWishlist(productId: number): boolean {
    return this.wishlistItems().some(
      product => product.id === productId
    );
  }

 addToWishlist(product: Product): void {
  if (this.isInWishlist(product.id)) return;

  this.wishlistItems.update(items => [...items, product]);

  console.log('Added to wishlist:', this.wishlistItems());
}

  removeFromWishlist(productId: number): void {
    this.wishlistItems.update(items =>
      items.filter(product => product.id !== productId)
    );
  }
  

  toggleWishlist(product: Product): void {
    if (this.isInWishlist(product.id)) {
      this.removeFromWishlist(product.id);
    } else {
      this.addToWishlist(product);
    }
  }

  clearWishlist(): void {
    this.wishlistItems.set([]);
  }
}