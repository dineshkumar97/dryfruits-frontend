
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Product {
  id: number;
  name: string;
  category: string;
  weight: string;
  price: number;
  oldPrice: number;
  image: string;
  description: string;
  stock: number;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly storageKey = 'nutnest-admin-products';
  private readonly migrationKey = 'nutnest-product-catalog-initialized';

  private readonly isBrowser: boolean;

  private readonly defaultProducts: Product[] = [
    {
      id: 1,
      name: 'Premium California Almonds',
      category: 'Almonds',
      weight: '250g',
      price: 330,
      oldPrice: 380,
      image: 'images/almonds.png',
      description: 'Premium quality California almonds, carefully selected for freshness and taste.',
      stock: 20,
      active: true
    },
    {
      id: 2,
      name: 'Premium Whole Cashews',
      category: 'Cashews',
      weight: '250g',
      price: 290,
      oldPrice: 340,
      image: 'images/cashews.png',
      description: 'Delicious whole cashews with a rich, naturally creamy taste.',
      stock: 20,
      active: true
    },
    {
      id: 3,
      name: 'Premium Pistachios',
      category: 'Pistachios',
      weight: '250g',
      price: 350,
      oldPrice: 400,
      image: 'images/pistachios.png',
      description: 'Crunchy premium pistachios selected for quality and freshness.',
      stock: 20,
      active: true
    },
    {
      id: 4,
      name: 'Premium Black Dates',
      category: 'Dates',
      weight: '250g',
      price: 180,
      oldPrice: 220,
      image: 'images/black_dates.png',
      description: 'Naturally sweet dates with a soft texture.',
      stock: 20,
      active: true
    },
    {
      id: 5,
      name: 'Golden Raisins',
      category: 'Raisins',
      weight: '250g',
      price: 150,
      oldPrice: 180,
      image: 'images/golden_raisins.png',
      description: 'Sweet and delicious golden raisins.',
      stock: 20,
      active: true
    },
    {
      id: 6,
      name: 'Premium Walnuts',
      category: 'Walnuts',
      weight: '250g',
      price: 320,
      oldPrice: 370,
      image: 'images/walnuts.png',
      description: 'Premium walnuts with a rich taste and crunchy texture.',
      stock: 20,
      active: true
    }
  ];

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getProducts(): Product[] {

    if (!this.isBrowser) {
      return this.defaultProducts;
    }

    try {

      const savedProducts = localStorage.getItem(this.storageKey);
      const initialized = localStorage.getItem(this.migrationKey);

      let products: Product[] = savedProducts
        ? JSON.parse(savedProducts)
        : [];

      if (!Array.isArray(products)) {
        products = [];
      }

      // Preserve existing products and initialize the six original products once.
      if (initialized !== 'true') {

        const mergedProducts = this.defaultProducts.map(defaultProduct => {

          const existingProduct = products.find(
            product => product.id === defaultProduct.id
          );

          return existingProduct
            ? { ...defaultProduct, ...existingProduct }
            : defaultProduct;

        });

        const additionalProducts = products.filter(
          product =>
            !this.defaultProducts.some(
              defaultProduct => defaultProduct.id === product.id
            )
        );

        products = [...mergedProducts, ...additionalProducts];

        localStorage.setItem(
          this.storageKey,
          JSON.stringify(products)
        );

        localStorage.setItem(this.migrationKey, 'true');
      }

      return products;

    } catch (error) {
      console.error('Unable to load product catalogue:', error);
      return this.defaultProducts;
    }
  }

  getProductById(id: number): Product | undefined {
    return this.getProducts().find(product => product.id === id);
  }

  saveProducts(products: Product[]): void {

    if (!this.isBrowser) return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(products)
      );

      localStorage.setItem(this.migrationKey, 'true');

    } catch (error) {
      console.error('Unable to save product catalogue:', error);
    }
  }

  // Convert product weight into grams
  private getWeightInGrams(weight: string): number {
    if (weight === '1kg') {
      return 1000;
    }

    return Number(weight.replace('g', ''));
  }

  // Deduct purchased quantities from inventory
  deductStock(
    items: {
      productId: number;
      weight: string;
      quantity: number;
    }[]
  ): { success: boolean; message: string } {

    const products = this.getProducts();

    const requiredStock = new Map<number, number>();

    // Group quantities by product, accounting for different weights
    for (const item of items) {

      const product = products.find(
        product => product.id === item.productId
      );

      if (!product || !product.active) {
        return {
          success: false,
          message: `Product ${item.productId} is unavailable.`
        };
      }

      const weightGrams = this.getWeightInGrams(item.weight);

      if (
        !Number.isFinite(weightGrams) ||
        weightGrams <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return {
          success: false,
          message: 'Invalid product quantity or weight.'
        };
      }

      const totalGrams = weightGrams * item.quantity;

      requiredStock.set(
        item.productId,
        (requiredStock.get(item.productId) || 0) + totalGrams
      );
    }

    // Validate all products before changing any stock
    for (const [productId, requiredGrams] of requiredStock) {

      const product = products.find(
        product => product.id === productId
      )!;

      const baseGrams = this.getWeightInGrams(product.weight);

      const availableGrams = product.stock * baseGrams;

      if (requiredGrams > availableGrams) {
        return {
          success: false,
          message: `Insufficient stock for ${product.name}.`
        };
      }
    }

    // Deduct stock
    for (const [productId, requiredGrams] of requiredStock) {

      const product = products.find(
        product => product.id === productId
      )!;

      const baseGrams = this.getWeightInGrams(product.weight);

      product.stock = Number(
        (
          product.stock - requiredGrams / baseGrams
        ).toFixed(3)
      );
    }

    this.saveProducts(products);

    return {
      success: true,
      message: 'Inventory updated successfully.'
    };
  }

}
