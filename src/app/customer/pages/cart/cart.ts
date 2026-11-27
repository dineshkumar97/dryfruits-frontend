
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

  // =====================================
  // CART STATE
  // =====================================

  cartItems = signal<CartItem[]>([]);

  stockError = signal('');

  isLoading = signal(true);

  private destroy$ = new Subject<void>();

  // =====================================
  // CART SUMMARY
  // =====================================

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

  constructor(
    private cartService: CartService
  ) {}

  // =====================================
  // INITIALIZE CART
  // =====================================

  ngOnInit(): void {
    this.loadCart();
  }

  // =====================================
  // LOAD CART AND REFRESH API DATA
  // =====================================

  loadCart(): void {

    this.isLoading.set(true);
    this.stockError.set('');

    // Show saved cart selections immediately.
    this.cartItems.set(this.cartService.getCartItems());

    // Fetch latest products and stock from MongoDB.
    this.cartService.refreshCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: result => {

          // Update cart with latest product information.
          this.cartItems.set(this.cartService.getCartItems());

          this.stockError.set(
            result.success ? '' : result.message
          );

          this.isLoading.set(false);

        },

        error: error => {

          console.error('Cart refresh error:', error);

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

    this.loadCart();
  }

  // =====================================
  // DECREASE QUANTITY
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

    this.loadCart();
  }

  // =====================================
  // REMOVE ITEM
  // =====================================

  removeItem(item: CartItem): void {

    this.cartService.removeItem(
      item.productId,
      item.weight
    );

    this.stockError.set('');

    this.cartItems.set(this.cartService.getCartItems());

    // Refresh remaining cart items.
    this.loadCart();
  }

  // =====================================
  // RETRY REFRESH
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
