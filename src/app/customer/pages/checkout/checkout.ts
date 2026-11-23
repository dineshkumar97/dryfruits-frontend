import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Cart as CartService } from '../../../core/services/cart';
import { OrderService } from '../../../core/services/order';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {

  checkoutForm;

  constructor(
    private fb: FormBuilder,
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.checkoutForm = this.fb.group({

      name: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],

      mobile: ['', [
        Validators.required,
        Validators.pattern('^[6-9][0-9]{9}$')
      ]],

      email: ['', [
        Validators.email
      ]],

      address: ['', [
        Validators.required,
        Validators.minLength(10)
      ]],

      city: ['Chennai', [
        Validators.required,
        Validators.minLength(2)
      ]],

      pincode: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{6}$')
      ]],

      paymentMethod: ['COD', [
        Validators.required
      ]]

    });
  }

  get cartItems() {
    return this.cartService.getCartItems();
  }

  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  get getTotalQuantity(): number {
    return this.cartService.getTotalQuantity();
  }

  placeOrder(): void {

    if (this.checkoutForm.invalid || this.cartItems.length === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const formValue = this.checkoutForm.getRawValue();

    const order = this.orderService.createOrder({
      customer: {
        name: formValue.name!,
        mobile: formValue.mobile!,
        email: formValue.email!,
        address: formValue.address!,
        city: formValue.city!,
        pincode: formValue.pincode!
      },
      items: this.cartItems,
      subtotal: this.subtotal,
      paymentMethod: formValue.paymentMethod as 'COD' | 'ONLINE'
    });

    this.cartService.clearCart();
    // this.clearWishlist();

    this.router.navigate(['/order-success'], {
      state: { orderId: order.orderId }
    });

  }
  private clearWishlist(): void {
    localStorage.removeItem('nutnest-wishlist');
  }
  get totalSavings(): number {
  return this.cartItems.reduce(
    (total, item) => total + (item.oldPrice - item.price) * item.quantity,
    0
  );
}
}