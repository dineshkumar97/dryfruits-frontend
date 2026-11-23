import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-order-success',
  standalone: true,
 imports: [RouterLink,DatePipe],
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
      this.router.navigate(['/']);
    }
  }
}