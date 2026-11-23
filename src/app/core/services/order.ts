import { Injectable } from '@angular/core';
import { CartItem } from './cart';

export interface Order {
  orderId: string;
  customer: {
    name: string;
    mobile: string;
    email: string;
    address: string;
    city: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  paymentMethod: 'COD' | 'ONLINE';
  createdAt: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly storageKey = 'nutnest-orders';

  createOrder(orderData: Omit<Order, 'orderId' | 'createdAt' | 'status'>): Order {
    const order: Order = {
      ...orderData,
      orderId: 'NN' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'Confirmed'
    };

    const orders = this.getOrders();

    orders.push(order);

    localStorage.setItem(this.storageKey, JSON.stringify(orders));

    return order;
  }

  getOrders(): Order[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) || '[]'
      );
    } catch {
      return [];
    }
  }

  getLatestOrder(): Order | null {
    const orders = this.getOrders();

    return orders.length
      ? orders[orders.length - 1]
      : null;
  }
}