
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

export interface StoreCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
}

interface CategoryApiResponse<T> {
  message: string;
  data: T;
}

interface CategoryApiItem {
  _id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private readonly apiUrl =
    'http://localhost:3000/dry-fruits-be-nut/category';

  private readonly cacheKey = 'nutnest-categories-cache';

  private readonly isBrowser: boolean;

  private categoriesSubject =
    new BehaviorSubject<StoreCategory[]>([]);

  categories$ = this.categoriesSubject.asObservable();

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
  // MAP MONGODB CATEGORY
  // =====================================
  private mapCategory(category: CategoryApiItem): StoreCategory {

    return {
      id: category._id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      active: category.active
    };
  }

  // =====================================
  // GET CACHED CATEGORIES
  // =====================================
  getCategories(): StoreCategory[] {

    if (this.categoriesSubject.value.length > 0) {
      return this.categoriesSubject.value;
    }

    if (!this.isBrowser) {
      return [];
    }

    try {

      const saved = localStorage.getItem(this.cacheKey);

      if (!saved) {
        return [];
      }

      const categories: StoreCategory[] = JSON.parse(saved);

      if (Array.isArray(categories)) {
        this.categoriesSubject.next(categories);
        return categories;
      }

      return [];

    } catch (error) {

      console.error('Unable to load category cache:', error);
      return [];

    }
  }

  // =====================================
  // UPDATE CATEGORY CACHE
  // =====================================
  private updateCache(categories: StoreCategory[]): void {

    this.categoriesSubject.next(categories);

    if (!this.isBrowser) return;

    try {

      localStorage.setItem(
        this.cacheKey,
        JSON.stringify(categories)
      );

    } catch (error) {

      console.error('Unable to update category cache:', error);

    }
  }

  // =====================================
  // GET ALL CATEGORIES - ADMIN
  // =====================================
  getAdminCategories(): Observable<StoreCategory[]> {

    return this.http.get<CategoryApiResponse<CategoryApiItem[]>>(
      `${this.apiUrl}/admin`,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(response =>
        response.data.map(category =>
          this.mapCategory(category)
        )
      ),

      tap(categories => {
        this.updateCache(categories);
      })

    );

  }

  // =====================================
  // GET ACTIVE CATEGORIES - CUSTOMER
  // =====================================
  getActiveCategories(): Observable<StoreCategory[]> {

    return this.http.get<CategoryApiResponse<CategoryApiItem[]>>(
      `${this.apiUrl}/active`
    ).pipe(

      map(response =>
        response.data.map(category =>
          this.mapCategory(category)
        )
      ),

      tap(categories => {
        this.updateCache(categories);
      })

    );

  }

  // =====================================
  // CREATE CATEGORY
  // =====================================
  createCategory(
    category: Omit<StoreCategory, 'id'>
  ): Observable<StoreCategory> {

    return this.http.post<CategoryApiResponse<CategoryApiItem>>(
      `${this.apiUrl}/create`,
      category,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(response =>
        this.mapCategory(response.data)
      ),

      tap(createdCategory => {

        const categories = this.getCategories();

        this.updateCache([
          ...categories,
          createdCategory
        ]);

      })

    );

  }

  // =====================================
  // UPDATE CATEGORY
  // =====================================
  updateCategory(
    id: string,
    category: Partial<Omit<StoreCategory, 'id'>>
  ): Observable<StoreCategory> {

    return this.http.put<CategoryApiResponse<CategoryApiItem>>(
      `${this.apiUrl}/update/${id}`,
      category,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(response =>
        this.mapCategory(response.data)
      ),

      tap(updatedCategory => {

        const categories = this.getCategories().map(item =>
          item.id === id
            ? updatedCategory
            : item
        );

        this.updateCache(categories);

      })

    );

  }

  // =====================================
  // DELETE CATEGORY
  // =====================================
  deleteCategory(id: string): Observable<void> {

    return this.http.delete<CategoryApiResponse<unknown>>(
      `${this.apiUrl}/delete/${id}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(

      map(() => undefined),

      tap(() => {

        const categories = this.getCategories().filter(
          item => item.id !== id
        );

        this.updateCache(categories);

      })

    );

  }

}
