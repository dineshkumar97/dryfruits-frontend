
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { OrderService, Order } from '../../../core/services/order';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss'
})
export class MyOrders implements OnInit {

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  expandedOrderId = signal<string | null>(null);

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderService.getMyOrders().subscribe({

      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading customer orders:', error);

        this.errorMessage.set(
          error.error?.message || 'Unable to load your orders.'
        );

        this.isLoading.set(false);
      }

    });
  }

  toggleOrderDetails(orderId: string): void {
    this.expandedOrderId.update(current =>
      current === orderId ? null : orderId
    );
  }

  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrderId() === orderId;
  }

  getPaymentMethod(method: string): string {
    return method === 'COD' ? 'Cash on Delivery' : 'Online Payment';
  }

  getItemTotal(price: number, quantity: number): number {
    return price * quantity;
  }

  getItemDiscount(oldPrice: number | undefined, price: number): number {
    return Math.max(0, (oldPrice ?? price) - price);
  }

  getTotalDiscount(order: Order): number {
    return order.items.reduce((total, item) => {
      return total +
        this.getItemDiscount(item.oldPrice, item.price) * item.quantity;
    }, 0);
  }

  getOriginalTotal(order: Order): number {
    return order.subtotal + this.getTotalDiscount(order);
  }
}
