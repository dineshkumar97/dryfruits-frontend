
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss'
})
export class OrderSuccess {

  order: Order | null = null;

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {
    this.order = this.orderService.getLatestOrder();

    if (!this.order) {
      this.router.navigate(['/home']);
    }
  }

  getItemSavings(item: Order['items'][number]): number {
    return Math.max(0, (item.oldPrice ?? item.price) - item.price);
  }

  get totalDiscount(): number {
    if (!this.order) return 0;

    return this.order.items.reduce((total, item) => {
      return total + this.getItemSavings(item) * item.quantity;
    }, 0);
  }

  get originalSubtotal(): number {
    if (!this.order) return 0;

    return this.order.subtotal + this.totalDiscount;
  }

  get discountPercentage(): number {
    if (this.originalSubtotal === 0) return 0;

    return Math.round(
      (this.totalDiscount / this.originalSubtotal) * 100
    );
  }
}
