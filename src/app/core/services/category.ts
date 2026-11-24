
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from './product';

export interface StoreCategory {
  id: number;
  name: string;
  description: string;
  image: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private readonly storageKey = 'nutnest-admin-categories';
  private readonly migrationKey = 'nutnest-category-catalog-initialized';

  private readonly isBrowser: boolean;

  constructor(
    private productService: ProductService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getCategories(): StoreCategory[] {

    if (!this.isBrowser) {
      return this.createDefaultCategories();
    }

    try {

      const savedCategories = localStorage.getItem(this.storageKey);
      const initialized = localStorage.getItem(this.migrationKey);

      let categories: StoreCategory[] = savedCategories
        ? JSON.parse(savedCategories)
        : [];

      if (!Array.isArray(categories)) {
        categories = [];
      }

      // Initialize existing product categories once.
      if (initialized !== 'true') {

        const productCategories = this.createDefaultCategories();

        productCategories.forEach(defaultCategory => {

          const exists = categories.some(
            category =>
              category.name.toLowerCase() ===
              defaultCategory.name.toLowerCase()
          );

          if (!exists) {
            categories.push(defaultCategory);
          }

        });

        this.saveCategories(categories);

        localStorage.setItem(this.migrationKey, 'true');
      }

      return categories;

    } catch (error) {
      console.error('Unable to load categories:', error);
      return this.createDefaultCategories();
    }
  }

  saveCategories(categories: StoreCategory[]): void {

    if (!this.isBrowser) return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(categories)
      );
    } catch (error) {
      console.error('Unable to save categories:', error);
    }
  }

  private createDefaultCategories(): StoreCategory[] {

    const products = this.productService.getProducts();

    const uniqueCategories = [
      ...new Set(products.map(product => product.category))
    ];

    return uniqueCategories.map((name, index) => {

      const product = products.find(
        item => item.category === name
      );

      return {
        id: index + 1,
        name,
        description: '',
        image: product?.image ?? '',
        active: true
      };

    });
  }

}
