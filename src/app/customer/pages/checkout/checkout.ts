
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
import { ProductService } from '../../../core/services/product';

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

  // Checkout charges
  readonly deliveryCharge = 12;
  readonly deliveryDiscount = 12;
  readonly handlingCharge = 2;

  constructor(
    private fb: FormBuilder,
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private productService: ProductService
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

    const userData = localStorage.getItem('nutnest-user');

    if (userData) {
      try {
        const parsedData = JSON.parse(userData);

        this.checkoutForm.patchValue({
          name: parsedData.name || '',
          mobile: parsedData.phone || '',
          email: parsedData.email || '',
          address: parsedData.address || '',
          city: parsedData.city || 'Chennai',
          pincode: parsedData.pincode || ''
        });

      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }

  get cartItems() {
    return this.cartService.getCartItems();
  }

  // Discounted product total
  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  // Original product total before discount
  get originalSubtotal(): number {
    return this.cartItems.reduce(
      (total, item) =>
        total + item.oldPrice * item.quantity,
      0
    );
  }

  // Total quantity
  get getTotalQuantity(): number {
    return this.cartService.getTotalQuantity();
  }

  // Total product savings
  get totalSavings(): number {
    return this.cartItems.reduce(
      (total, item) =>
        total + Math.max(0, item.oldPrice - item.price) * item.quantity,
      0
    );
  }

  // Final payable amount
  get grandTotal(): number {
    return this.subtotal + this.handlingCharge;
  }

  // Total discount percentage
  get totalSavingsPercentage(): number {
    if (this.originalSubtotal <= 0) {
      return 0;
    }

    return Math.round(
      (this.totalSavings / this.originalSubtotal) * 100
    );
  }

  getProductDiscount(item: any): number {
    if (!item.oldPrice || item.oldPrice <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.round(
        ((item.oldPrice - item.price) / item.oldPrice) * 100
      )
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

    // Step 1: Validate stock
    const stockValidation = this.cartService.validateCart();

    if (!stockValidation.success) {
      this.stockError = stockValidation.message;
      return;
    }

    // Step 2: Get latest cart
    const currentCartItems = this.cartService.getCartItems();

    // Step 3: Get customer information
    const formValue = this.checkoutForm.getRawValue();

    this.isSubmitting = true;

    // Step 4: Create order
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

      // Keep the existing API's item subtotal field unchanged.
      subtotal: currentCartItems.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      ),

      paymentMethod: formValue.paymentMethod as 'COD' | 'ONLINE'

    }).subscribe({

      next: (order) => {

        // Clear cart only after successful order creation
        this.cartService.clearCart();

        // Refresh inventory
        this.productService.getActiveProducts().subscribe({

          next: () => {

            console.log('Latest product stock refreshed.');

            this.router.navigate(['/order-success'], {
              state: {
                orderId: order.orderId
              }
            });

          },

          error: (error) => {

            console.error('Unable to refresh product stock:', error);

            this.router.navigate(['/order-success'], {
              state: {
                orderId: order.orderId
              }
            });

          }

        });

      },

      error: (error) => {

        console.error('Order creation failed:', error);

        this.stockError =
          error?.error?.message ||
          'Unable to place your order. Please try again.';

        this.isSubmitting = false;

      }

    });

  }

}
