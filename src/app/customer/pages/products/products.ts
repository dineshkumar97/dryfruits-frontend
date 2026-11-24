
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Product, ProductService } from '../../../core/services/product';
import { CategoryService } from '../../../core/services/category';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products {

  private readonly wishlistKey = 'nutnest-wishlist';

  wishlistIds: number[] = this.loadWishlist();

  selectedCategory = 'All Products';

  products: Product[] = [];

  private activeCategoryNames: string[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {
    this.loadProducts();
  }

  // Active category names from Admin Categories
  get categories(): string[] {
    return [
      'All Products',
      ...this.categoryService
        .getCategories()
        .filter(category => category.active)
        .map(category => category.name)
    ];
  }

  // Load active products belonging to active categories
  loadProducts(): void {

    const activeCategories = this.categoryService
      .getCategories()
      .filter(category => category.active);

    this.activeCategoryNames = activeCategories.map(
      category => category.name.toLowerCase()
    );

    this.products = this.productService
      .getProducts()
      .filter(product =>
        product.active &&
        this.activeCategoryNames.includes(product.category.toLowerCase())
      );

    // Reset selection if its category is no longer active
    if (
      this.selectedCategory !== 'All Products' &&
      !activeCategories.some(
        category => category.name === this.selectedCategory
      )
    ) {
      this.selectedCategory = 'All Products';
    }
  }

  // Filter products by category
  get filteredProducts(): Product[] {

    if (this.selectedCategory === 'All Products') {
      return this.products;
    }

    return this.products.filter(
      product => product.category === this.selectedCategory
    );
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  // Wishlist
  toggleWishlist(productId: number, event: Event): void {

    event.stopPropagation();

    if (this.isWishlisted(productId)) {
      this.wishlistIds = this.wishlistIds.filter(
        id => id !== productId
      );
    } else {
      this.wishlistIds = [...this.wishlistIds, productId];
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        this.wishlistKey,
        JSON.stringify(this.wishlistIds)
      );
    }
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistIds.includes(productId);
  }

  private loadWishlist(): number[] {

    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem(this.wishlistKey) || '[]'
      );

      return Array.isArray(saved)
        ? saved.filter((id): id is number =>
            Number.isInteger(id) && id > 0
          )
        : [];

    } catch {
      return [];
    }
  }

}
