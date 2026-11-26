
import {
  Injectable,
  Inject,
  PLATFORM_ID,
  signal,
  computed
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';
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

  // Cart items Signal
  private items = signal<CartItem[]>([]);

  // Computed Cart Signals
  cartItems = computed(() =>
    this.items().map(item => ({ ...item }))
  );

  cartCount = computed(() =>
    this.items().length
  );

  totalQuantity = computed(() =>
    this.items().reduce(
      (total, item) => total + item.quantity,
      0
    )
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
      this.items.set(this.loadCart());
      this.syncCartPrices();
      this.saveCart();
    }
  }

  // Get cart items
  getCartItems(): CartItem[] {
    return this.cartItems();
  }

  // Add product to cart
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

    // Check whether the same product and weight already exist
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

    const updatedItem = this.getLatestCartItem(item, product);

    const usedGrams = this.getUsedStockGrams(item.productId);

   const requestedGrams =
  this.getWeightInGrams(item.weight) * item.quantity;

const availableGrams =
  product.stock * this.getWeightInGrams(product.weight);

if (requestedGrams > availableGrams) {
      const availableQuantity = Math.floor(
        Math.max(0, availableGrams - usedGrams) /
        this.getWeightInGrams(item.weight)
      );

      return {
        success: false,
        message: availableQuantity > 0
          ? `Only ${availableQuantity} more pack(s) are available.`
          : 'Sorry, insufficient stock available.'
      };
    }

    // Add new product to cart
    this.items.update(items => [
      ...items,
      updatedItem
    ]);

    this.saveCart();

    return {
      success: true,
      message: 'Product added to cart successfully.'
    };
  }

  // Update cart quantity
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

    const usedGrams = this.getUsedStockGrams(
      productId,
      weight
    );

    const requestedGrams =
      this.getWeightInGrams(weight) * quantity;

    const availableGrams =
      product.stock * this.getWeightInGrams(product.weight);

    if (usedGrams + requestedGrams > availableGrams) {
      const availableQuantity = Math.floor(
        Math.max(0, availableGrams - usedGrams) /
        this.getWeightInGrams(weight)
      );

      return {
        success: false,
        message: availableQuantity > 0
          ? `Maximum available quantity is ${availableQuantity}.`
          : 'Sorry, insufficient stock available.'
      };
    }

    this.items.update(items =>
      items.map(cartItem =>
        cartItem.productId === productId &&
          cartItem.weight === weight
          ? { ...cartItem, quantity }
          : cartItem
      )
    );

    this.syncCartPrices();
    this.saveCart();

    return {
      success: true,
      message: 'Cart quantity updated successfully.'
    };
  }

  // Remove cart item
  removeItem(productId: number, weight: string): void {

    this.items.update(items =>
      items.filter(
        item =>
          !(item.productId === productId &&
            item.weight === weight)
      )
    );

    this.saveCart();
  }

  // Get number of cart lines
  getCartCount(): number {
    return this.cartCount();
  }

  // Get subtotal
  getSubtotal(): number {
    return this.subtotal();
  }

  // Get total quantity
  getTotalQuantity(): number {
    return this.totalQuantity();
  }

  // Get remaining quantity for selected weight
  /*  getAvailableQuantity(productId: number, weight: string): number {
 
     const product = this.productService.getProductById(productId);
 
     if (!product || !product.active) {
       return 0;
     }
 
     const availableGrams =
       product.stock * this.getWeightInGrams(product.weight);
 
     const usedGrams = this.getUsedStockGrams(productId);
 
     const remainingGrams = Math.max(
       0,
       availableGrams - usedGrams
     );
 
     return Math.floor(
       remainingGrams / this.getWeightInGrams(weight)
     );
   } */


  getAvailableQuantity(productId: number, weight: string): number {
    const product = this.productService.getProductById(productId);
    if (!product || !product.active) {
      return 0;
    }
    // Cart items do not reserve or deduct stock.
    return Math.max(0, Number(product.stock) || 0);
  }

  // Validate entire cart before checkout
  validateCart(): CartActionResult {

    this.syncCartPrices();

    for (const item of this.items()) {

      const product = this.productService.getProductById(
        item.productId
      );

      if (!product || !product.active) {
        return {
          success: false,
          message: `${item.name} is currently unavailable.`
        };
      }

      if (
        this.getUsedStockGrams(item.productId) >
        product.stock * this.getWeightInGrams(product.weight)
      ) {
        return {
          success: false,
          message: `Insufficient stock available for ${item.name}. Please update your cart.`
        };
      }
    }

    return {
      success: true,
      message: 'Cart validation successful.'
    };
  }

  // Clear cart
  clearCart(): void {
    this.items.set([]);
    this.saveCart();
  }

  // Calculate weight in grams
  private getWeightInGrams(weight: string): number {

    if (weight === '1kg') {
      return 1000;
    }

    return Number(weight.replace('g', ''));
  }

  // Calculate total stock consumed by a product
  private getUsedStockGrams(
    productId: number,
    excludeWeight?: string
  ): number {

    return this.items()
      .filter(item =>
        item.productId === productId &&
        item.weight !== excludeWeight
      )
      .reduce(
        (total, item) =>
          total + this.getWeightInGrams(item.weight) * item.quantity,
        0
      );
  }

  // Get latest name, image and prices


  // Refresh cart prices after Admin changes
  private syncCartPrices(): void {

    this.items.update(items =>
      items.map(item => {

        const product = this.productService.getProductById(
          item.productId
        );

        if (!product) {
          return item;
        }

        return this.getLatestCartItem(item, product);
      })
    );
  }

  // Save cart
  private saveCart(): void {

    if (!this.isBrowser) return;

    try {

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.items())
      );

      console.log(
        'Cart saved successfully. Count:',
        this.cartCount()
      );

    } catch (error) {
      console.error('Unable to save cart:', error);
    }
  }

  // Load existing cart
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
  private getLatestCartItem(
    item: CartItem,
    product: Product
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
      quantity: item.quantity
    };
  }
}
