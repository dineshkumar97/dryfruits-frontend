
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Cart as CartService } from '../../../core/services/cart';
import { OrderService } from '../../../core/services/order';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {

  customer = {
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: 'Chennai',
    pincode: ''
  };

  paymentMethod: 'COD' | 'ONLINE' = 'COD';

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  get cartItems() {
    return this.cartService.getCartItems();
  }

  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  placeOrder(form: NgForm): void {

    if (form.invalid || this.cartItems.length === 0) {
      form.control.markAllAsTouched();
      return;
    }

    const order = this.orderService.createOrder({
      customer: { ...this.customer },
      items: this.cartItems,
      subtotal: this.subtotal,
      paymentMethod: this.paymentMethod
    });

    this.cartService.clearCart();

    this.router.navigate(['/order-success'], {
      state: { orderId: order.orderId }
    });
  }
}
