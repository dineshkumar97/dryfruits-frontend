
import {
  Component,
  Inject,
  PLATFORM_ID,
  signal,
  computed
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { Cart as CartService } from '../../../core/services/cart';
import {
  Product,
  ProductService
} from '../../../core/services/product';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class Wishlist {

  private readonly wishlistKey = 'nutnest-wishlist';
  private readonly isBrowser: boolean;

  // Signals
  products = signal<Product[]>([]);
  wishlistIds = signal<number[]>([]);

  // Computed wishlist products
  wishlistProducts = computed(() =>
    this.products().filter(product =>
      this.wishlistIds().includes(product.id)
    )
  );

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    @Inject(PLATFORM_ID) platformId: object
  ) {

    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadWishlist();
      this.loadProducts();
    }

  }

  // Load active products from MongoDB API
  loadProducts(): void {

    this.productService.getActiveProducts().subscribe({

      next: (products: Product[]) => {

        this.products.set(
          products.filter(product => product.active)
        );

        console.log('Wishlist IDs:', this.wishlistIds());
        console.log(
          'Available product IDs:',
          this.products().map(product => product.id)
        );
        console.log('Wishlist products:', this.wishlistProducts());

      },

      error: (error) => {

        console.error('Wishlist products API error:', error);

        this.products.set([]);

      }

    });

  }

  // Remove product from wishlist
  removeFromWishlist(productId: number): void {

    this.wishlistIds.update(ids =>
      ids.filter(id => id !== productId)
    );

    this.saveWishlist();

  }

  // Add wishlist product to cart
  addToCart(product: Product): void {

    this.cartService.addToCart({
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

  }

  // Load saved wishlist IDs
  private loadWishlist(): void {

    try {

      const saved = JSON.parse(
        localStorage.getItem(this.wishlistKey) || '[]'
      );

      this.wishlistIds.set(
        Array.isArray(saved)
          ? saved.filter((id): id is number =>
              Number.isInteger(id) && id > 0
            )
          : []
      );

    } catch {

      this.wishlistIds.set([]);

    }

  }

  // Save wishlist IDs
  private saveWishlist(): void {

    if (!this.isBrowser) return;

    localStorage.setItem(
      this.wishlistKey,
      JSON.stringify(this.wishlistIds())
    );

  }

}
