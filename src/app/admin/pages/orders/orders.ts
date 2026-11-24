
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { OrderService, Order } from '../../../core/services/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders {

  orders: Order[] = [];

  searchTerm = '';
  selectedStatus = 'All';

  selectedOrder: Order | null = null;

  errorMessage = '';
  successMessage = '';

  private readonly isBrowser: boolean;

  statusOptions = [
    'Confirmed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  constructor(
    private orderService: OrderService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadOrders();
    }
  }

  // Load customer orders
  loadOrders(): void {
    this.orders = [...this.orderService.getOrders()].reverse();
  }

  // Filter orders
  get filteredOrders(): Order[] {
    return this.orders.filter(order => {

      const search = this.searchTerm.trim().toLowerCase();

      const matchesSearch =
        order.orderId.toLowerCase().includes(search) ||
        order.customer.name.toLowerCase().includes(search) ||
        order.customer.mobile.includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Dashboard summary
  get totalOrders(): number {
    return this.orders.length;
  }

  get activeOrders(): number {
    return this.orders.filter(order =>
      !['Delivered', 'Cancelled'].includes(order.status)
    ).length;
  }

  get deliveredOrders(): number {
    return this.orders.filter(
      order => order.status === 'Delivered'
    ).length;
  }

  get totalOrderValue(): number {
    return this.orders
      .filter(order => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.subtotal, 0);
  }

  // View order details
  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Close order details
  closeDetails(): void {
    this.selectedOrder = null;
  }

  // Update order status
  updateStatus(order: Order, status: string): void {
    this.errorMessage = '';
    this.successMessage = '';

    const updated = this.orderService.updateOrderStatus(
      order.orderId,
      status
    );

    if (!updated) {
      this.errorMessage = 'Unable to update order status. Please try again.';
      this.loadOrders();
      return;
    }

    this.loadOrders();

    if (this.selectedOrder?.orderId === order.orderId) {
      this.selectedOrder =
        this.orders.find(item => item.orderId === order.orderId) ?? null;
    }

    this.successMessage =
      `Order ${order.orderId} status updated successfully.`;
  }

  // Status CSS class
  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

}
