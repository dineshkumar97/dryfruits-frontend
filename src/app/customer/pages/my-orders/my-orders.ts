
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

  // Angular Signals
  orders = signal<Order[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

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

        console.log(
          'Customer orders loaded:',
          this.orders()
        );

        this.isLoading.set(false);
      },

      error: (error) => {

        console.error(
          'Error loading customer orders:',
          error
        );

        this.errorMessage.set(
          error.error?.message || 'Unable to load your orders.'
        );

        this.isLoading.set(false);
      }

    });
  }
}
