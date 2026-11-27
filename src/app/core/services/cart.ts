
import {
  Injectable,
  Inject,
  PLATFORM_ID,
  signal,
  computed
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';
import { Observable, map } from 'rxjs';

import { ProductService, Product } from './product';

export interface CartItem {
  productId: number;
  mongoId?: string;
  name: string;
  image: string;
  category: string;
  weight: string;
  price: number;
  quantity: number;
  oldPrice: number;
}

export interface CartActionResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class Cart {

  private readonly storageKey = 'nutnest-cart';
  private readonly isBrowser: boolean;

  private items = signal<CartItem[]>([]);

  cartItems = computed(() =>
    this.items().map(item => ({ ...item }))
  );

  cartCount = computed(() => this.items().length);

  totalQuantity = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  subtotal = computed(() =>
    this.items().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  );

  totalSavings = computed(() =>
    this.items().reduce(
      (total, item) =>
        total + (item.oldPrice - item.price) * item.quantity,
      0
    )
  );

  constructor(
    private productService: ProductService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      // Load only saved cart selections.
      this.items.set(this.loadCart());
      this.saveCart();
    }
  }

  // =====================================
  // REFRESH CART FROM BACKEND
  // =====================================

  refreshCart(): Observable<CartActionResult> {
    return this.productService.refreshProducts().pipe(
      map(products => {
        this.syncCartPrices(products);

        return this.validateCartWithProducts(products);
      })
    );
  }

  // =====================================
  // GET CART ITEMS
  // =====================================

  getCartItems(): CartItem[] {
    return this.cartItems();
  }

  // =====================================
  // ADD TO CART
  // =====================================

  addToCart(item: CartItem): CartActionResult {

    const product = this.productService.getProductById(item.productId);

    if (!product || !product.active) {
      return {
        success: false,
        message: 'This product is currently unavailable.'
      };
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return {
        success: false,
        message: 'Please select a valid quantity.'
      };
    }

    const existingItem = this.items().find(
      cartItem =>
        cartItem.productId === item.productId &&
        cartItem.weight === item.weight
    );

    if (existingItem) {
      return {
        success: false,
        message: 'This product is already in your cart. Update quantity from your cart.'
      };
    }

    const available = Math.max(0, Number(product.stock) || 0);

    if (item.quantity > available) {
      return {
        success: false,
        message: `Only ${available} pack(s) are available.`
      };
    }

    this.items.update(items => [
      ...items,
      this.getLatestCartItem(item, product)
    ]);

    this.saveCart();

    return {
      success: true,
      message: 'Product added to cart successfully.'
    };
  }

  // =====================================
  // UPDATE QUANTITY
  // =====================================

  updateQuantity(
    productId: number,
    weight: string,
    quantity: number
  ): CartActionResult {

    const item = this.items().find(
      cartItem =>
        cartItem.productId === productId &&
        cartItem.weight === weight
    );

    if (!item) {
      return {
        success: false,
        message: 'Cart item not found.'
      };
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        success: false,
        message: 'Quantity must be at least one.'
      };
    }

    const product = this.productService.getProductById(productId);

    if (!product || !product.active) {
      return {
        success: false,
        message: 'This product is currently unavailable.'
      };
    }

    const available = Math.max(0, Number(product.stock) || 0);

    if (quantity > available) {
      return {
        success: false,
        message: `Only ${available} pack(s) are available.`
      };
    }

    this.items.update(items =>
      items.map(cartItem =>
        cartItem.productId === productId &&
        cartItem.weight === weight
          ? this.getLatestCartItem(cartItem, product, quantity)
          : cartItem
      )
    );

    this.saveCart();

    return {
      success: true,
      message: 'Cart quantity updated successfully.'
    };
  }

  // =====================================
  // REMOVE ITEM
  // =====================================

  removeItem(productId: number, weight: string): void {
    this.items.update(items =>
      items.filter(
        item =>
          !(item.productId === productId && item.weight === weight)
      )
    );

    this.saveCart();
  }

  // =====================================
  // CART TOTALS
  // =====================================

  getCartCount(): number {
    return this.cartCount();
  }

  getSubtotal(): number {
    return this.subtotal();
  }

  getTotalQuantity(): number {
    return this.totalQuantity();
  }

  // =====================================
  // AVAILABLE QUANTITY
  // =====================================

  getAvailableQuantity(productId: number, weight: string): number {
    const product = this.productService.getProductById(productId);

    if (!product || !product.active) {
      return 0;
    }

    return Math.max(0, Number(product.stock) || 0);
  }

  // =====================================
  // VALIDATE CART
  // =====================================

  validateCart(): CartActionResult {

    if (!this.productService.areProductsLoaded()) {
      return {
        success: false,
        message: 'Please refresh product information before checkout.'
      };
    }

    return this.validateCartWithProducts(
      this.productService.getProducts()
    );
  }

  private validateCartWithProducts(
    products: Product[]
  ): CartActionResult {

    for (const item of this.items()) {

      const product = products.find(
        product => product.id === item.productId
      );

      if (!product || !product.active) {
        return {
          success: false,
          message: `${item.name} is currently unavailable.`
        };
      }

      if (item.quantity > product.stock) {
        return {
          success: false,
          message: `Only ${product.stock} pack(s) of ${item.name} are available.`
        };
      }
    }

    return {
      success: true,
      message: 'Cart validation successful.'
    };
  }

  // =====================================
  // CLEAR CART
  // =====================================

  clearCart(): void {
    this.items.set([]);
    this.saveCart();
  }

  // =====================================
  // SYNC LATEST PRODUCT DATA
  // =====================================

  private syncCartPrices(products: Product[]): void {

    this.items.update(items =>
      items.map(item => {

        const product = products.find(
          product => product.id === item.productId
        );

        if (!product) {
          return item;
        }

        return this.getLatestCartItem(item, product);
      })
    );

    this.saveCart();
  }

  // =====================================
  // LATEST CART ITEM
  // =====================================

  private getLatestCartItem(
    item: CartItem,
    product: Product,
    quantity: number = item.quantity
  ): CartItem {

    return {
      productId: product.id,
      mongoId: product.mongoId,
      name: product.name,
      image: product.image,
      category: product.category,
      weight: product.weight,
      price: product.price,
      oldPrice: product.oldPrice,
      quantity
    };
  }

  // =====================================
  // SAVE CART SELECTIONS
  // =====================================

  private saveCart(): void {

    if (!this.isBrowser) return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.items())
      );
    } catch (error) {
      console.error('Unable to save cart:', error);
    }
  }

  // =====================================
  // LOAD CART SELECTIONS
  // =====================================

  private loadCart(): CartItem[] {

    try {
      const savedItems: unknown = JSON.parse(
        localStorage.getItem(this.storageKey) || '[]'
      );

      if (!Array.isArray(savedItems)) {
        return [];
      }

      return savedItems.filter(item =>
        item &&
        Number.isInteger(item.productId) &&
        typeof item.name === 'string' &&
        typeof item.weight === 'string' &&
        Number.isFinite(item.price) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      ) as CartItem[];

    } catch {
      return [];
    }
  }
}
