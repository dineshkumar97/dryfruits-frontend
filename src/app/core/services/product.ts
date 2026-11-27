
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

  private readonly apiUrl = `${environment.apiUrl}/product`;
  private readonly isBrowser: boolean;

  // In-memory cache only. No product localStorage.
  private products: Product[] = [];
  private productsLoaded = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Authorization header
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

  // Convert MongoDB product to frontend product
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
      stock: Number(product.stock) || 0,
      active: product.active
    };
  }

  // Update in-memory cache
  private updateCache(products: Product[]): void {
    this.products = [...products];
    this.productsLoaded = true;
  }

  // Refresh products directly from MongoDB API
  refreshProducts(): Observable<Product[]> {
    return this.getActiveProducts();
  }

  // Cache status
  areProductsLoaded(): boolean {
    return this.productsLoaded;
  }

  // Get cached products
  getProducts(): Product[] {
    return [...this.products];
  }

  // Get product by frontend ID
  getProductById(id: number): Product | undefined {
    return this.products.find(product => product.id === id);
  }

  // Get product by MongoDB ID
  getProductByMongoId(mongoId: string): Product | undefined {
    return this.products.find(product => product.mongoId === mongoId);
  }

  // Get active customer products from API
  getActiveProducts(): Observable<Product[]> {
    return this.http.get<ProductApiResponse<ProductApiItem[]>>(
      this.apiUrl
    ).pipe(
      map(response =>
        (response.data || []).map(product =>
          this.mapProduct(product)
        )
      ),
      tap(products => this.updateCache(products))
    );
  }

  // Get admin products from API
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
      tap(products => this.updateCache(products))
    );
  }

  // Create product
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
      map(response => this.mapProduct(response.data)),
      tap(newProduct => {
        this.updateCache([
          ...this.products,
          newProduct
        ]);
      })
    );
  }

  // Update product
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
      map(response => this.mapProduct(response.data)),
      tap(updatedProduct => {
        const updatedProducts = this.products.map(item =>
          item.mongoId === mongoId ? updatedProduct : item
        );

        this.updateCache(updatedProducts);
      })
    );
  }

  // Delete product
  deleteProduct(mongoId: string): Observable<void> {
    return this.http.delete<ProductApiResponse<unknown>>(
      `${this.apiUrl}/${mongoId}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      map(() => undefined),
      tap(() => {
        this.updateCache(
          this.products.filter(item => item.mongoId !== mongoId)
        );
      })
    );
  }

  // Clear in-memory cache
  clearCache(): void {
    this.products = [];
    this.productsLoaded = false;
  }
}
