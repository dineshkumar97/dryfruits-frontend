
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Cart as CartService } from '../../../core/services/cart';
import type { Product } from '../../../core/services/product';
import { Wishlist as WishlistService } from '../../../core/services/wishlist';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class Wishlist {

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private toastService: Toast
  ) {}

  // Get wishlist products
  wishlistProducts = computed(() =>
    this.wishlistService.products()
  );

  // Get available stock
  getAvailableQuantity(product: Product): number {
    return Math.max(0, Number(product.stock) || 0);
  }

  // Check stock availability
  isOutOfStock(product: Product): boolean {
    return this.getAvailableQuantity(product) <= 0;
  }

  // Remove product
  removeFromWishlist(productId: number): void {
    this.wishlistService.removeFromWishlist(productId);
    this.toastService.success('Product removed from wishlist.');
  }

  // Add product to cart
  addToCart(product: Product): void {

    const available = this.getAvailableQuantity(product);

    if (available <= 0) {
      this.toastService.warning(
        'Sorry, this product is out of stock.'
      );
      return;
    }

    const result = this.cartService.addToCart({
      productId: product.id,
      mongoId: product.mongoId,
      name: product.name,
      image: product.image,
      category: product.category,
      weight: product.weight,
      price: product.price,
      quantity: 1,
      oldPrice: product.oldPrice
    });

    if (result.success) {
      this.toastService.success(result.message);
    } else {
      this.toastService.warning(result.message);
    }
  }
}
