
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

  constructor(
    private fb: FormBuilder,
    public cartService: CartService,
    private orderService: OrderService,
    private productService: ProductService,
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

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    if (this.cartItems.length === 0) {
      this.stockError =
        'Your cart is empty. Please add products before checkout.';
      return;
    }

    // Step 1: Validate current stock
    const stockValidation = this.cartService.validateCart();

    if (!stockValidation.success) {
      this.stockError = stockValidation.message;
      return;
    }

    // Step 2: Get latest cart information
    const currentCartItems = this.cartService.getCartItems();

    // Step 3: Deduct stock before creating the order
    const stockResult = this.productService.deductStock(
      currentCartItems.map(item => ({
        productId: item.productId,
        weight: item.weight,
        quantity: item.quantity
      }))
    );

    if (!stockResult.success) {
      this.stockError = stockResult.message;
      return;
    }

    // Step 4: Create the confirmed order
    const formValue = this.checkoutForm.getRawValue();

    const order = this.orderService.createOrder({

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

    });

    // Step 5: Clear cart and navigate
    this.cartService.clearCart();

    this.router.navigate(['/order-success'], {
      state: { orderId: order.orderId }
    });

  }

}
