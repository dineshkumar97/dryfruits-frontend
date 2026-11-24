
import { Component, computed, signal } from '@angular/core';
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

  wishlistIds = signal<number[]>(this.loadWishlist());

selectedCategory = signal('All Products');

products = signal<Product[]>([]);

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
  // Load active products from MongoDB API
  loadProducts(): void {

    this.productService.getActiveProducts().subscribe({

      next: (products: Product[]) => {

        this.products.set(products.filter(
          product => product.active
        ));

        console.log('Customer products loaded:', this.products());
      },

      error: (error) => {

        console.error('Customer products API error:', error);

        this.products.set([]);

      }

    });

  }

  // Filter products by category
 
  filteredProducts = computed(() => {

  const selected = this.selectedCategory();
  const products = this.products();

  if (selected === 'All Products') {
    return products;
  }

  return products.filter(
    product => product.category === selected
  );

});

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  // Wishlist
  toggleWishlist(productId: number, event: Event): void {

    event.stopPropagation();

    if (this.isWishlisted(productId)) {
      this.wishlistIds.set(this.wishlistIds().filter(
        id => id !== productId
      ));
    } else {
      this.wishlistIds.set([...this.wishlistIds(), productId]);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        this.wishlistKey,
        JSON.stringify(this.wishlistIds())
      );
    }
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistIds().includes(productId);
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
