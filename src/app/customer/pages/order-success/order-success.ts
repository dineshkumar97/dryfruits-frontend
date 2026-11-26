
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { OrderService, Order } from '../../../core/services/order';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss'
})
export class OrderSuccess {

  order: Order | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService
  ) {

  }


  isLoggedIn(): boolean {
    console.log(this.authService.isLoggedIn())
    return this.authService.isLoggedIn();
  }


}
