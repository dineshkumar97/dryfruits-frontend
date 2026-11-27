
import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import {
  Cart as CartService,
  CartItem
} from '../../../core/services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart implements OnInit, OnDestroy {

  // Cart state
  cartItems = signal<CartItem[]>([]);
  stockError = signal('');
  isLoading = signal(true);

  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService
  ) {}

  // Cart summary using computed signals
  totalQuantity = computed(() =>
    this.cartItems().reduce(
      (total, item) => total + item.quantity,
      0
    )
  );

  subtotal = computed(() =>
    this.cartItems().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  );

  totalSavings = computed(() =>
    this.cartItems().reduce(
      (total, item) =>
        total + (item.oldPrice - item.price) * item.quantity,
      0
    )
  );

  // =====================================
  // INITIALIZE CART
  // =====================================

  ngOnInit(): void {
    this.loadCart();
  }

  // =====================================
  // LOAD CART AND REFRESH API ONCE
  // =====================================

  loadCart(): void {

    this.isLoading.set(true);
    this.stockError.set('');

    // Load saved cart items immediately
    this.cartItems.set(this.cartService.getCartItems());

    // Fetch latest product information once
    this.cartService.refreshCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: result => {

          this.cartItems.set(this.cartService.getCartItems());

          this.stockError.set(
            result.success ? '' : result.message
          );

          this.isLoading.set(false);
        },

        error: error => {

          console.error('Cart API error:', error);

          this.stockError.set(
            'Unable to refresh product availability. Please try again.'
          );

          this.isLoading.set(false);
        }
      });
  }

  // =====================================
  // AVAILABLE STOCK
  // =====================================

  getAvailableStock(item: CartItem): number {
    return this.cartService.getAvailableQuantity(
      item.productId,
      item.weight
    );
  }

  // =====================================
  // STOCK STATUS
  // =====================================

  getStockStatus(item: CartItem): string {

    const available = this.getAvailableStock(item);

    if (available <= 0) return 'Out of Stock';
    if (available <= 5) return 'Limited Stock';

    return 'In Stock';
  }

  // =====================================
  // INCREASE QUANTITY
  // NO API CALL
  // =====================================

  increaseQuantity(item: CartItem): void {

    if (this.isLoading()) return;

    const result = this.cartService.updateQuantity(
      item.productId,
      item.weight,
      item.quantity + 1
    );

    if (!result.success) {
      this.stockError.set(result.message);
      return;
    }

    this.cartItems.set(this.cartService.getCartItems());
    this.stockError.set('');
  }

  // =====================================
  // DECREASE QUANTITY
  // NO API CALL
  // =====================================

  decreaseQuantity(item: CartItem): void {

    if (this.isLoading() || item.quantity <= 1) return;

    const result = this.cartService.updateQuantity(
      item.productId,
      item.weight,
      item.quantity - 1
    );

    if (!result.success) {
      this.stockError.set(result.message);
      return;
    }

    this.cartItems.set(this.cartService.getCartItems());
    this.stockError.set('');
  }

  // =====================================
  // REMOVE ITEM
  // NO API CALL
  // =====================================

  removeItem(item: CartItem): void {

    this.cartService.removeItem(
      item.productId,
      item.weight
    );

    this.cartItems.set(this.cartService.getCartItems());
    this.stockError.set('');
  }

  // =====================================
  // RETRY API REFRESH
  // =====================================

  retryRefresh(): void {
    this.loadCart();
  }

  // =====================================
  // DESTROY
  // =====================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
