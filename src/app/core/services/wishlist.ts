
import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product';

@Injectable({
  providedIn: 'root'
})
export class Wishlist {

  private readonly storageKey = 'ratasree_wishlist';

  private wishlistItems = signal<Product[]>(this.loadWishlist());

  products = this.wishlistItems.asReadonly();

  wishlistCount = computed(() => this.wishlistItems().length);

  // Load wishlist from localStorage
  private loadWishlist(): Product[] {
    try {
      const savedWishlist = localStorage.getItem(this.storageKey);

      return savedWishlist ? JSON.parse(savedWishlist) as Product[] : [];
    } catch (error) {
      console.error('Unable to load wishlist:', error);
      return [];
    }
  }

  // Save wishlist to localStorage
  private saveWishlist(): void {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.wishlistItems())
      );
    } catch (error) {
      console.error('Unable to save wishlist:', error);
    }
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistItems().some(
      product => product.id === productId
    );
  }

  addToWishlist(product: Product): void {
    if (this.isInWishlist(product.id)) return;

    this.wishlistItems.update(items => [...items, product]);

    this.saveWishlist();
  }

  removeFromWishlist(productId: number): void {
    this.wishlistItems.update(items =>
      items.filter(product => product.id !== productId)
    );

    this.saveWishlist();
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
    this.saveWishlist();
  }
}
