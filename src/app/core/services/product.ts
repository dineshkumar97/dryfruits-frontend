
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// =====================================
// PRODUCT INTERFACE
// =====================================

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

// =====================================
// API INTERFACES
// =====================================

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

  // =====================================
  // CONFIGURATION
  // =====================================

  private readonly apiUrl = `${environment.apiUrl}/product`;

  private readonly isBrowser: boolean;

  // =====================================
  // PRODUCT CACHE
  // =====================================

  private products: Product[] = [];

  private productsLoaded = false;

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

  private mapProduct(product: ProductApiItem): Product {

    return {
      id: Number.parseInt(product._id.slice(-8), 16),
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
  // UPDATE PRODUCT CACHE
  // =====================================

  private updateCache(products: Product[]): void {

    this.products = [...products];

    this.productsLoaded = true;

  }

  // =====================================
  // GET CACHE STATUS
  // =====================================

  areProductsLoaded(): boolean {

    return this.productsLoaded;

  }

  // =====================================
  // GET CACHED PRODUCTS
  // =====================================

  getProducts(): Product[] {

    return [...this.products];

  }

  // =====================================
  // GET PRODUCT BY ID
  // =====================================

  getProductById(id: number): Product | undefined {

    return this.products.find(
      product => product.id === id
    );

  }

  // =====================================
  // GET PRODUCT BY MONGODB ID
  // =====================================

  getProductByMongoId(mongoId: string): Product | undefined {

    return this.products.find(
      product => product.mongoId === mongoId
    );

  }

  // =====================================
  // GET ACTIVE PRODUCTS - CUSTOMER
  // =====================================

  getActiveProducts(): Observable<Product[]> {

    return this.http.get<ProductApiResponse<ProductApiItem[]>>(
      this.apiUrl
    ).pipe(

      map(response =>
        (response.data || []).map(product =>
          this.mapProduct(product)
        )
      ),

      tap(products => {
        this.updateCache(products);
      })

    );

  }

  // =====================================
  // GET ALL PRODUCTS - ADMIN
  // =====================================

  getAdminProducts(): Observable<Product[]> {

    return this.http.get<ProductApiResponse<ProductApiItem[]>>(
      `${this.apiUrl}/admin`,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(response =>
        (response.data || []).map(product =>
          this.mapProduct(product)
        )
      ),

      tap(products => {
        this.updateCache(products);
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

        this.updateCache([
          ...this.products,
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

        const updatedProducts = this.products.map(item =>
          item.mongoId === mongoId
            ? updatedProduct
            : item
        );

        this.updateCache(updatedProducts);

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

        const updatedProducts = this.products.filter(
          item => item.mongoId !== mongoId
        );

        this.updateCache(updatedProducts);

      })

    );

  }

  // =====================================
  // CLEAR PRODUCT CACHE
  // =====================================

  clearCache(): void {

    this.products = [];

    this.productsLoaded = false;

  }

}
