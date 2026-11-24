
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { Cart as CartService } from '../../../core/services/cart';
import { OrderService } from '../../../core/services/order';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {

  checkoutForm;
  stockError = '';
  isSubmitting = false;

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

  get totalSavings(): number {
    return this.cartItems.reduce(
      (total, item) =>
        total + (item.oldPrice - item.price) * item.quantity,
      0
    );
  }

  placeOrder(): void {

    this.stockError = '';

    if (this.isSubmitting) {
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    if (this.cartItems.length === 0) {
      this.stockError =
        'Your cart is empty. Please add products before checkout.';
      return;
    }

    // Step 1: Validate current cart
    const stockValidation = this.cartService.validateCart();

    if (!stockValidation.success) {
      this.stockError = stockValidation.message;
      return;
    }

    // Step 2: Get latest cart information
    const currentCartItems = this.cartService.getCartItems();

    // Step 3: Prepare customer details
    const formValue = this.checkoutForm.getRawValue();

    this.isSubmitting = true;

    // Step 4: Create order in MongoDB
    this.orderService.createOrder({

      customer: {
        name: formValue.name!,
        mobile: formValue.mobile!,
        email: formValue.email ?? '',
        address: formValue.address!,
        city: formValue.city!,
        pincode: formValue.pincode!
      },

      items: currentCartItems,

      subtotal: currentCartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),

      paymentMethod: formValue.paymentMethod as 'COD' | 'ONLINE'

    }).subscribe({

      next: (order) => {

        // Step 5: Clear cart after successful API response
        this.cartService.clearCart();

        // Step 6: Navigate to success page
        this.router.navigate(['/order-success'], {
          state: {
            orderId: order.orderId
          }
        });

      },

      error: (error) => {

        console.error('Order creation failed:', error);

        this.stockError =
          error.error?.message ||
          'Unable to place your order. Please try again.';

        this.isSubmitting = false;

      }

    });

  }

}
