
import { Component } from '@angular/core';
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

  orderId = '';
  mobile = '';
  order: Order | null = null;
  errorMessage = '';

  constructor(private orderService: OrderService) {}

  trackOrder(): void {
    this.errorMessage = '';
    this.order = null;

    const orders = this.orderService.getOrders();

    const foundOrder = orders.find(order =>
      order.orderId.toLowerCase() === this.orderId.trim().toLowerCase() &&
      order.customer.mobile === this.mobile.trim()
    );

    if (foundOrder) {
      this.order = foundOrder;
    } else {
      this.errorMessage =
        'Order not found. Please check your Order ID and mobile number.';
    }
  }
}
