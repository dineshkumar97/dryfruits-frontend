
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { OrderService, Order } from '../../../core/services/order';

interface CustomerRecord {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Order[];
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './customers.html',
  styleUrl: './customers.scss'
})
export class Customers {

  customers: CustomerRecord[] = [];

  searchTerm = '';
  selectedCustomer: CustomerRecord | null = null;

  private readonly isBrowser: boolean;

  constructor(
    private orderService: OrderService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadCustomers();
    }
  }

  // Load customers from existing orders
  loadCustomers(): void {

    const orders = this.orderService.getOrders();

    const groupedOrders = new Map<string, Order[]>();

    orders.forEach(order => {

      const mobile = order.customer.mobile.trim();

      if (!mobile) return;

      if (!groupedOrders.has(mobile)) {
        groupedOrders.set(mobile, []);
      }

      groupedOrders.get(mobile)!.push(order);

    });

    this.customers = Array.from(groupedOrders.entries())
      .map(([mobile, customerOrders]) => {

        const sortedOrders = [...customerOrders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        const latestOrder = sortedOrders[0];

        const totalSpent = sortedOrders
          .filter(order => order.status !== 'Cancelled')
          .reduce(
            (total, order) => total + order.subtotal,
            0
          );

        return {
          ...latestOrder.customer,
          mobile,
          totalOrders: sortedOrders.length,
          totalSpent,
          lastOrderDate: latestOrder.createdAt,
          orders: sortedOrders
        };

      })
      .sort(
        (a, b) =>
          new Date(b.lastOrderDate).getTime() -
          new Date(a.lastOrderDate).getTime()
      );
  }

  // Search customers
  get filteredCustomers(): CustomerRecord[] {

    const search = this.searchTerm.trim().toLowerCase();

    return this.customers.filter(customer =>
      customer.name.toLowerCase().includes(search) ||
      customer.mobile.includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.city.toLowerCase().includes(search)
    );
  }

  // Summary
  get totalCustomers(): number {
    return this.customers.length;
  }

  get totalOrders(): number {
    return this.customers.reduce(
      (total, customer) => total + customer.totalOrders,
      0
    );
  }

  get totalRevenue(): number {
    return this.customers.reduce(
      (total, customer) => total + customer.totalSpent,
      0
    );
  }

  // Customer details popup
  viewCustomer(customer: CustomerRecord): void {
    this.selectedCustomer = customer;
  }

  closeDetails(): void {
    this.selectedCustomer = null;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

}
