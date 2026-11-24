
import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrderService, Order } from '../../../core/services/order';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './track-order.html',
  styleUrl: './track-order.scss'
})
export class TrackOrder {

  // Form Signals
  orderId = signal('');
  mobile = signal('');

  // State Signals
  order = signal<Order | null>(null);
  errorMessage = signal('');
  isLoading = signal(false);

  // Computed Signals
  totalDiscount = computed(() => {

    const currentOrder = this.order();

    if (!currentOrder) return 0;

    return currentOrder.items.reduce((total, item) => {

      const savings = Math.max(
        0,
        (item.oldPrice ?? item.price) - item.price
      );

      return total + savings * item.quantity;

    }, 0);
  });

  originalSubtotal = computed(() => {

    const currentOrder = this.order();

    if (!currentOrder) return 0;

    return currentOrder.subtotal + this.totalDiscount();
  });

  discountPercentage = computed(() => {

    const original = this.originalSubtotal();

    if (original === 0) return 0;

    return Math.round(
      (this.totalDiscount() / original) * 100
    );
  });

  constructor(private orderService: OrderService) {}

  // Get individual item savings
  getItemSavings(item: Order['items'][number]): number {

    return Math.max(
      0,
      (item.oldPrice ?? item.price) - item.price
    );
  }

  // Track customer order
  trackOrder(): void {

    this.errorMessage.set('');
    this.order.set(null);

    if (!this.orderId().trim() || !this.mobile().trim()) {

      this.errorMessage.set(
        'Please enter your Order ID and mobile number.'
      );

      return;
    }

    this.isLoading.set(true);

    this.orderService
      .getOrderById(this.orderId().trim())
      .subscribe({

        next: (foundOrder) => {

          this.isLoading.set(false);

          // Verify registered mobile number
          if (
            foundOrder.customer.mobile !== this.mobile().trim()
          ) {

            this.errorMessage.set(
              'Order not found. Please check your Order ID and mobile number.'
            );

            return;
          }

          this.order.set(foundOrder);
          console.log('Order found:', foundOrder);

        },

        error: (error) => {

          console.error('Order tracking failed:', error);

          this.isLoading.set(false);

          this.errorMessage.set(
            'Order not found or unable to track your order. Please check your details and try again.'
          );

        }

      });
  }
}
