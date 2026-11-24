
import { Component, Inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

import { Product, ProductService } from '../../../core/services/product';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class Inventory {

  private readonly lowStockLimit = 5;
  private readonly isBrowser: boolean;

  // STATE
  products = signal<Product[]>([]);

  searchTerm = signal('');
  selectedFilter = signal('All');

  selectedProduct = signal<Product | null>(null);
  updatedStock = signal(0);

  formError = signal('');
  successMessage = signal('');

  isLoading = signal(false);
  isSaving = signal(false);

  // SUMMARY
  totalProducts = computed(
    () => this.products().length
  );

  totalStock = computed(
    () => this.products().reduce(
      (total, product) => total + Number(product.stock || 0),
      0
    )
  );

  lowStockCount = computed(
    () => this.products().filter(
      product =>
        product.stock > 0 &&
        product.stock <= this.lowStockLimit
    ).length
  );

  outOfStockCount = computed(
    () => this.products().filter(
      product => product.stock === 0
    ).length
  );

  // SEARCH AND FILTER
  filteredProducts = computed(() => {

    const search = this.searchTerm().trim().toLowerCase();
    const filter = this.selectedFilter();

    return this.products().filter(product => {

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      const matchesFilter =
        filter === 'All' ||
        (filter === 'In Stock' && product.stock > this.lowStockLimit) ||
        (
          filter === 'Low Stock' &&
          product.stock > 0 &&
          product.stock <= this.lowStockLimit
        ) ||
        (filter === 'Out of Stock' && product.stock === 0);

      return matchesSearch && matchesFilter;
    });
  });

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private productService: ProductService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadProducts();
    }
  }

  // LOAD PRODUCTS FROM BACKEND
  loadProducts(): void {

    if (!this.isBrowser) return;

    this.isLoading.set(true);
    this.successMessage.set('');
    this.formError.set('');

    this.productService.getAdminProducts().subscribe({

      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },

      error: (error) => {

        console.error('Unable to load inventory:', error);

        this.products.set([]);
        this.isLoading.set(false);

        this.formError.set(
          error.error?.message ||
          'Unable to load inventory. Please try again.'
        );
      }

    });
  }

  // STOCK STATUS
  getStockStatus(stock: number): string {

    if (stock === 0) {
      return 'Out of Stock';
    }

    if (stock <= this.lowStockLimit) {
      return 'Low Stock';
    }

    return 'In Stock';
  }

  getStockClass(stock: number): string {

    if (stock === 0) {
      return 'out-of-stock';
    }

    if (stock <= this.lowStockLimit) {
      return 'low-stock';
    }

    return 'in-stock';
  }

  // OPEN STOCK UPDATE POPUP
  openStockUpdate(product: Product): void {

    this.selectedProduct.set({ ...product });
    this.updatedStock.set(product.stock);

    this.formError.set('');
    this.successMessage.set('');
  }

  // UPDATE STOCK THROUGH BACKEND
  updateStock(): void {

    this.formError.set('');

    const selected = this.selectedProduct();

    if (!selected) return;

    const stock = Number(this.updatedStock());

    if (!Number.isInteger(stock) || stock < 0) {
      this.formError.set('Please enter a valid stock quantity.');
      return;
    }

    const mongoId = selected.mongoId;

    if (!mongoId) {
      this.formError.set(
        'Product ID is missing. Please refresh inventory.'
      );
      return;
    }

    this.isSaving.set(true);

    this.productService.updateProduct(mongoId, { stock }).subscribe({

      next: (updatedProduct) => {

        this.products.update(products =>
          products.map(product =>
            product.mongoId === mongoId
              ? { ...product, ...updatedProduct, stock }
              : product
          )
        );

        this.selectedProduct.set(null);
        this.successMessage.set('Stock updated successfully.');

        this.isSaving.set(false);
      },

      error: (error) => {

        console.error('Unable to update stock:', error);

        this.formError.set(
          error.error?.message ||
          'Unable to update stock. Please try again.'
        );

        this.isSaving.set(false);
      }

    });
  }

  // CLOSE POPUP
  closeStockUpdate(): void {
    this.selectedProduct.set(null);
    this.formError.set('');
  }

}
