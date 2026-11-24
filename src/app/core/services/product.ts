
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  id: number;
  mongoId?: string;
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

interface ProductApiItem {
  _id: string;
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

interface ProductApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly storageKey = 'nutnest-admin-products';
  private readonly migrationKey = 'nutnest-product-catalog-initialized';

  private apiUrl = `${environment.apiUrl}/product`;
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

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // =====================================
  // AUTHORIZATION HEADER
  // =====================================

  private getHeaders(): HttpHeaders {

    const token = this.isBrowser
      ? localStorage.getItem('nutnest-access-token')
      : null;

    return token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : new HttpHeaders();

  }

  // =====================================
  // MAP MONGODB PRODUCT
  // =====================================

  private mapProduct(
    product: ProductApiItem
  ): Product {

    // Numeric compatibility ID for existing Angular components.
    // mongoId is the actual MongoDB ID used for API operations.
    const id = Number.parseInt(
      product._id.slice(-8),
      16
    );

    return {
      id,
      mongoId: product._id,
      name: product.name,
      category: product.category,
      weight: product.weight,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image || '',
      description: product.description || '',
      stock: product.stock,
      active: product.active
    };

  }

  // =====================================
  // GET ADMIN PRODUCTS
  // =====================================

  getAdminProducts(): Observable<Product[]> {

    return this.http.get<ProductApiResponse<ProductApiItem[]>>(
      `${this.apiUrl}/admin`,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(response =>
        response.data.map(product =>
          this.mapProduct(product)
        )
      ),

      tap(products => {
        this.saveProducts(products);
      })

    );

  }

  // =====================================
  // GET ACTIVE PRODUCTS
  // =====================================

  getActiveProducts(): Observable<Product[]> {

    return this.http.get<ProductApiResponse<ProductApiItem[]>>(
      this.apiUrl
    ).pipe(

      map(response =>
        response.data.map(product =>
          this.mapProduct(product)
        )
      ),

      tap(products => {
        this.saveProducts(products);
      })

    );

  }

  // =====================================
  // CREATE PRODUCT
  // =====================================

  createProduct(
    product: Omit<Product, 'id' | 'mongoId'>
  ): Observable<Product> {

    return this.http.post<ProductApiResponse<ProductApiItem>>(
      this.apiUrl,
      product,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(response =>
        this.mapProduct(response.data)
      ),

      tap(newProduct => {

        const products = this.getProducts();

        this.saveProducts([
          ...products,
          newProduct
        ]);

      })

    );

  }

  // =====================================
  // UPDATE PRODUCT
  // =====================================

  updateProduct(
    mongoId: string,
    product: Partial<Omit<Product, 'id' | 'mongoId'>>
  ): Observable<Product> {

    return this.http.put<ProductApiResponse<ProductApiItem>>(
      `${this.apiUrl}/${mongoId}`,
      product,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(response =>
        this.mapProduct(response.data)
      ),

      tap(updatedProduct => {

        const products = this.getProducts().map(item =>
          item.mongoId === mongoId
            ? updatedProduct
            : item
        );

        this.saveProducts(products);

      })

    );

  }

  // =====================================
  // DELETE PRODUCT
  // =====================================

  deleteProduct(mongoId: string): Observable<void> {

    return this.http.delete<ProductApiResponse<unknown>>(
      `${this.apiUrl}/${mongoId}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(() => undefined),

      tap(() => {

        const products = this.getProducts().filter(
          item => item.mongoId !== mongoId
        );

        this.saveProducts(products);

      })

    );

  }

  // =====================================
  // EXISTING LOCAL PRODUCT METHODS
  // Retained for Customer components
  // =====================================

  getProducts(): Product[] {

    if (!this.isBrowser) {
      return this.defaultProducts;
    }

    try {

      const savedProducts = localStorage.getItem(this.storageKey);

      const initialized = localStorage.getItem(
        this.migrationKey
      );

      let products: Product[] = savedProducts
        ? JSON.parse(savedProducts)
        : [];

      if (!Array.isArray(products)) {
        products = [];
      }

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

        products = [
          ...mergedProducts,
          ...additionalProducts
        ];

        this.saveProducts(products);

      }

      return products;

    } catch (error) {

      console.error('Unable to load product catalogue:', error);

      return this.defaultProducts;

    }

  }

  getProductById(id: number): Product | undefined {

    return this.getProducts().find(
      product => product.id === id
    );

  }

  saveProducts(products: Product[]): void {
    if (!this.isBrowser) return;
    try {

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(products)
      );
      localStorage.setItem(
        this.migrationKey,
        'true'
      );

    } catch (error) {

      console.error('Unable to save product catalogue:', error);

    }

  }

  // =====================================
  // EXISTING STOCK CALCULATION
  // Retained for legacy Customer flow
  // =====================================

  private getWeightInGrams(weight: string): number {

    if (weight === '1kg') {
      return 1000;
    }

    return Number(weight.replace('g', ''));

  }

  deductStock(
    items: {
      productId: number;
      weight: string;
      quantity: number;
    }[]
  ): { success: boolean; message: string } {

    const products = this.getProducts();

    const requiredStock = new Map<number, number>();

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

    // Validate before deducting
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
