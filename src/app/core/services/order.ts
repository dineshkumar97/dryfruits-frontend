
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

import { Observable, map } from 'rxjs';
import { CartItem } from './cart';

export interface Order {
  orderId: string;
  customer: {
    name: string;
    mobile: string;
    email: string;
    address: string;
    city: string;
    pincode: string ;
  };
  items: {
    productId: string;
    name: string;
    image: string;
    weight: string;
    price: number;
    oldPrice: number;
    quantity: number;
  }[];
  subtotal: number;
  paymentMethod: 'COD' | 'ONLINE';
  createdAt: string;
  status: string;
}

interface OrderApiItem {
  productId: string;
  name: string;
  image: string;
  weight: string;
  price: number;
  oldPrice: number;
  quantity: number;
}

interface OrderApiResponse {
  success: boolean;
  message: string;
  order: Order;
}

interface OrdersApiResponse {
  success: boolean;
  orders: Order[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl =
    'http://localhost:3000/dry-fruits-be-nut/order';

  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // AUTHORIZATION HEADER

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

  // CREATE ORDER

  createOrder(orderData: {
    customer: Order['customer'];
    items: CartItem[];
    subtotal: number;
    paymentMethod: 'COD' | 'ONLINE';
  }): Observable<Order> {

    const items: OrderApiItem[] = orderData.items.map(item => {

      if (!item.mongoId) {
        throw new Error(
          `MongoDB ID is missing for ${item.name}. Please refresh the product catalogue.`
        );
      }

      return {
        productId: item.mongoId,
        name: item.name,
        image: item.image,
        weight: item.weight,
        price: item.price,
        oldPrice: item.oldPrice,
        quantity: item.quantity
      };

    });

    return this.http.post<OrderApiResponse>(
      this.apiUrl,
      {
        ...orderData,
        items
      },
      {
        headers: this.getHeaders()
      }
    ).pipe(
      map(response => response.order)
    );

  }

  // GET ALL ADMIN ORDERS

  getAdminOrders(): Observable<Order[]> {

    return this.http.get<OrdersApiResponse>(
      `${this.apiUrl}/admin`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      map(response => response.orders)
    );

  }

  // GET ORDER BY ID

  getOrderById(orderId: string): Observable<Order> {

    return this.http.get<OrderApiResponse>(
      `${this.apiUrl}/${orderId}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      map(response => response.order)
    );

  }

  // UPDATE ORDER STATUS

  updateOrderStatus(
    orderId: string,
    status: string
  ): Observable<Order> {

    return this.http.put<OrderApiResponse>(
      `${this.apiUrl}/${orderId}/status`,
      { status },
      {
        headers: this.getHeaders()
      }
    ).pipe(
      map(response => response.order)
    );

  }
  
  getMyOrders(): Observable<Order[]> {
    return this.http
      .get<OrdersApiResponse>(
        `${this.apiUrl}/my-orders`,
        { headers: this.getHeaders() }
      )
      .pipe(
        map(response => response.orders)
      );
  }
}
