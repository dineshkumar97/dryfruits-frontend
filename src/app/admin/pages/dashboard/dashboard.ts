
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order';

interface RecentOrder {
  orderId: string;
  customer: string;
  date: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  private readonly isBrowser: boolean;
  private readonly productStorageKey = 'nutnest-admin-products';

  stats = [
    {
      title: 'Total Sales',
      value: '₹0',
      icon: '₹',
      description: 'All-time sales'
    },
    {
      title: 'Total Orders',
      value: '0',
      icon: '▤',
      description: 'Orders received'
    },
    {
      title: 'Total Products',
      value: '0',
      icon: '▣',
      description: 'Available products'
    },
    {
      title: 'Total Customers',
      value: '0',
      icon: '♙',
      description: 'Unique customers'
    }
  ];

  recentOrders: RecentOrder[] = [];

  errorMessage = '';

  constructor(
    private orderService: OrderService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadDashboardData();
    }
  }

  loadDashboardData(): void {

    // Fetch actual orders from MongoDB
    this.orderService.getAdminOrders().subscribe({

      next: (orders: Order[]) => {

        // Calculate total sales excluding cancelled orders
        const totalSales = orders
          .filter(order => order.status !== 'Cancelled')
          .reduce((total, order) => total + order.subtotal, 0);

        // Count unique customers using mobile number
        const totalCustomers = new Set(
          orders.map(order => order.customer.mobile)
        ).size;

        // Load products from Admin Products LocalStorage
        let totalProducts = 0;

        try {
          const savedProducts = localStorage.getItem(
            this.productStorageKey
          );

          const products = savedProducts
            ? JSON.parse(savedProducts)
            : [];

          totalProducts = Array.isArray(products)
            ? products.length
            : 0;

        } catch (error) {
          console.error('Unable to load products:', error);
        }

        // Update dashboard cards
        this.stats = [
          {
            title: 'Total Sales',
            value: `₹${totalSales.toLocaleString('en-IN')}`,
            icon: '₹',
            description: 'Sales excluding cancelled orders'
          },
          {
            title: 'Total Orders',
            value: String(orders.length),
            icon: '▤',
            description: 'Orders received'
          },
          {
            title: 'Total Products',
            value: String(totalProducts),
            icon: '▣',
            description: 'Products in catalogue'
          },
          {
            title: 'Total Customers',
            value: String(totalCustomers),
            icon: '♙',
            description: 'Unique customers'
          }
        ];

        // Latest five orders
        this.recentOrders = [...orders]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((order: Order) => ({
            orderId: order.orderId,
            customer: order.customer.name,
            date: new Date(order.createdAt).toLocaleDateString('en-IN'),
            amount: order.subtotal,
            status: order.status
          }));

      },

      error: (error) => {
        console.error('Unable to load dashboard orders:', error);
        this.errorMessage =
          error.error?.message || 'Unable to load dashboard data.';
      }

    });
  }

}
