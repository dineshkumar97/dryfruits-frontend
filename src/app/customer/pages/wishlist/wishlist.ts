
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Cart as CartService } from '../../../core/services/cart';
import { Product, ProductService } from '../../../core/services/product';
import { CategoryService } from '../../../core/services/category';

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

  products: Product[] = [];
  wishlistIds: number[] = [];

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadWishlist();
      this.loadProducts();
    }
  }

  // Load active products from shared catalogue
  loadProducts(): void {

    const activeCategories = this.categoryService
      .getCategories()
      .filter(category => category.active)
      .map(category => category.name.toLowerCase());

    this.products = this.productService
      .getProducts()
      .filter(product =>
        product.active &&
        activeCategories.includes(product.category.toLowerCase())
      );
  }

  // Get products saved in wishlist
  get wishlistProducts(): Product[] {
    return this.products.filter(product =>
      this.wishlistIds.includes(product.id)
    );
  }

  // Remove product from wishlist
  removeFromWishlist(productId: number): void {

    this.wishlistIds = this.wishlistIds.filter(
      id => id !== productId
    );

    this.saveWishlist();
  }

  // Add wishlist product to cart
  addToCart(product: Product): void {

    this.cartService.addToCart({
      productId: product.id,
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

      this.wishlistIds = Array.isArray(saved)
        ? saved.filter((id): id is number =>
            Number.isInteger(id) && id > 0
          )
        : [];

    } catch {
      this.wishlistIds = [];
    }
  }

  // Save wishlist IDs
  private saveWishlist(): void {

    if (!this.isBrowser) return;

    localStorage.setItem(
      this.wishlistKey,
      JSON.stringify(this.wishlistIds)
    );
  }

}
