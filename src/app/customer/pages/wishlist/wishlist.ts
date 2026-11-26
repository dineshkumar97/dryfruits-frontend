
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

  // Get wishlist products from shared service
  wishlistProducts = computed(() => {
    console.log(
      'Wishlist page products:',
      this.wishlistService.products()
    );

    return this.wishlistService.products();
  });

  // Remove product from wishlist
  removeFromWishlist(productId: number): void {
    this.wishlistService.removeFromWishlist(productId);
    this.toastService.success('Product removed from wishlist.');
  }

  // Add wishlist product to cart
  addToCart(product: Product): void {

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
