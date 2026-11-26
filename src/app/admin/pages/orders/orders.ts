
import { Component, Inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';
import { OrderService, Order } from '../../../core/services/order';
import { DatePipe, isPlatformBrowser, NgClass } from '@angular/common';
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders {

  private readonly isBrowser: boolean;

  orders = signal<Order[]>([]);

  searchTerm = signal('');
  selectedStatus = signal('All');

  selectedOrder = signal<Order | null>(null);
  selectedStatusValue = signal('');

  isUpdatingStatus = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  statusOptions = [
    'Confirmed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  filteredOrders = computed(() => {

    const search = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.orders().filter(order => {

      const matchesSearch =
        order.orderId.toLowerCase().includes(search) ||
        order.customer.name.toLowerCase().includes(search) ||
        order.customer.mobile.includes(search);

      const matchesStatus =
        status === 'All' || order.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  // Dashboard summary

  totalOrders = computed(() => this.orders().length);

  activeOrders = computed(() =>
    this.orders().filter(order =>
      !['Delivered', 'Cancelled'].includes(order.status)
    ).length
  );

  deliveredOrders = computed(() =>
    this.orders().filter(
      order => order.status === 'Delivered'
    ).length
  );

  totalOrderValue = computed(() =>
    this.orders()
      .filter(order => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.subtotal, 0)
  );

  constructor(
    private orderService: OrderService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadOrders();
    }
  }

  // Load all orders

  loadOrders(): void {

    if (!this.isBrowser) return;

    this.errorMessage.set('');
    this.orderService.getAdminOrders().subscribe({

      next: (orders) => {
        this.orders.set(orders);
      },

      error: (error) => {
        console.error('Error loading admin orders:', error);

        this.errorMessage.set(
          error.error?.message || 'Unable to load orders.'
        );
      }
    });
  }

  // View order details

  viewOrder(order: Order): void {

    this.selectedOrder.set(order);
    this.selectedStatusValue.set(order.status);

    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // Close order details

  closeDetails(): void {
    this.selectedOrder.set(null);
    this.selectedStatusValue.set('');
  }

  // Update order status

  updateStatus(order: Order): void {

    const status = this.selectedStatusValue();

    if (!status || status === order.status || this.isUpdatingStatus()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isUpdatingStatus.set(true);

    this.orderService.updateOrderStatus(
      order.orderId,
      status
    ).subscribe({

      next: (updatedOrder) => {

        this.orders.update(orders =>
          orders.map(item =>
            item.orderId === updatedOrder.orderId
              ? updatedOrder
              : item
          )
        );

        this.selectedOrder.set(updatedOrder);
        this.selectedStatusValue.set(updatedOrder.status);

        this.successMessage.set(
          `Order ${updatedOrder.orderId} status updated successfully.`
        );

        this.isUpdatingStatus.set(false);
      },

      error: (error) => {

        console.error('Error updating order status:', error);

        this.errorMessage.set(
          error.error?.message ||
          'Unable to update order status. Please try again.'
        );

        this.isUpdatingStatus.set(false);
      }
    });
  }

  // Status CSS class

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}
