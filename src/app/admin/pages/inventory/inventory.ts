
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

interface InventoryProduct {
  id: number;
  name: string;
  category: string;
  image: string;
  weight: string;
  price: number;
  oldPrice: number;
  stock: number;
  active: boolean;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class Inventory {

  private readonly storageKey = 'nutnest-admin-products';
  private readonly lowStockLimit = 5;
  private readonly isBrowser: boolean;

  products: InventoryProduct[] = [];

  searchTerm = '';
  selectedFilter = 'All';

  selectedProduct: InventoryProduct | null = null;
  updatedStock = 0;

  formError = '';
  successMessage = '';

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadProducts();
    }
  }

  // Load products from Admin Products storage
  loadProducts(): void {
    if (!this.isBrowser) return;

    try {
      const savedProducts = localStorage.getItem(this.storageKey);

      this.products = savedProducts
        ? JSON.parse(savedProducts)
        : [];

      this.successMessage = '';
      this.formError = '';

    } catch (error) {
      console.error('Unable to load inventory:', error);
      this.products = [];
    }
  }

  // Summary calculations
  get totalProducts(): number {
    return this.products.length;
  }

  get totalStock(): number {
    return this.products.reduce(
      (total, product) => total + Number(product.stock || 0),
      0
    );
  }

  get lowStockCount(): number {
    return this.products.filter(
      product => product.stock > 0 &&
        product.stock <= this.lowStockLimit
    ).length;
  }

  get outOfStockCount(): number {
    return this.products.filter(
      product => product.stock === 0
    ).length;
  }

  // Product search and stock filter
  get filteredProducts(): InventoryProduct[] {

    return this.products.filter(product => {

      const search = this.searchTerm.trim().toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      const matchesFilter =
        this.selectedFilter === 'All' ||
        (this.selectedFilter === 'In Stock' && product.stock > this.lowStockLimit) ||
        (this.selectedFilter === 'Low Stock' &&
          product.stock > 0 &&
          product.stock <= this.lowStockLimit) ||
        (this.selectedFilter === 'Out of Stock' && product.stock === 0);

      return matchesSearch && matchesFilter;
    });
  }

  // Stock status
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

  // Open stock update popup
  openStockUpdate(product: InventoryProduct): void {

    this.selectedProduct = { ...product };
    this.updatedStock = product.stock;
    this.formError = '';
    this.successMessage = '';
  }

  // Save updated stock
  updateStock(): void {

    this.formError = '';

    if (!this.selectedProduct) {
      return;
    }

    const stock = Number(this.updatedStock);

    if (!Number.isInteger(stock) || stock < 0) {
      this.formError = 'Please enter a valid stock quantity.';
      return;
    }

    const productExists = this.products.some(
      product => product.id === this.selectedProduct!.id
    );

    if (!productExists) {
      this.formError = 'Product not found. Please refresh inventory.';
      return;
    }

    this.products = this.products.map(product =>
      product.id === this.selectedProduct!.id
        ? { ...product, stock }
        : product
    );

    this.saveToStorage();

    this.selectedProduct = null;

    this.successMessage = 'Stock updated successfully.';
  }

  // Save shared product data
  private saveToStorage(): void {

    if (!this.isBrowser) return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.products)
      );
    } catch (error) {
      console.error('Unable to save inventory:', error);
      this.formError = 'Unable to save stock. Please try again.';
    }
  }

  closeStockUpdate(): void {
    this.selectedProduct = null;
    this.formError = '';
  }

}
