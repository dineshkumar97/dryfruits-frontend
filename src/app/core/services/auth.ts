
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface LoginResponse {
  message: string;
  token: string;
  data: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
    status: string;
    uniqueUserId: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/user`;

  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(email: string, password: string): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/authenticate`,
      { email, password }
    ).pipe(
      tap(response => {

        if (this.isBrowser) {
          localStorage.setItem(
            'nutnest-access-token',
            response.token
          );

          localStorage.setItem(
            'nutnest-user',
            JSON.stringify(response.data)
          );
        }

      })
    );
  }

   checkCustomerMobile(phone: string): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/check-customer-mobile`,
      { phone }
    ).pipe(
      tap(response => {

        if (this.isBrowser) {
          localStorage.setItem(
            'nutnest-access-token',
            response.token
          );

          localStorage.setItem(
            'nutnest-user',
            JSON.stringify(response.data)
          );
        }

      })
    );
  }

  logout(): void {

    if (this.isBrowser) {
      localStorage.removeItem('nutnest-access-token');
      localStorage.removeItem('nutnest-user');
    }

  }

  getToken(): string | null {

    if (!this.isBrowser) return null;

    return localStorage.getItem('nutnest-access-token');
  }

  getUser(): LoginResponse['data'] | null {

    if (!this.isBrowser) return null;

    const user = localStorage.getItem('nutnest-user');

    return user ? JSON.parse(user) : null;
  }
  
  isLoggedIn(): boolean {
  return !!localStorage.getItem('nutnest-access-token');
}

}
