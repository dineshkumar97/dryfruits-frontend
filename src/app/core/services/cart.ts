
import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService, Product } from './product';

export interface CartItem {
  productId: number;
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

  cartCount = signal(0);

  private readonly storageKey = 'nutnest-cart';
  private readonly isBrowser: boolean;

  private items: CartItem[] = [];

  constructor(
    private productService: ProductService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.items = this.loadCart();
      this.syncCartPrices();
      this.cartCount.set(this.getCartCount());
    }
  }

  // Get cart items with latest product information
  getCartItems(): CartItem[] {
    this.syncCartPrices();
    return this.items.map(item => ({ ...item }));
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

    const updatedItem = this.getLatestCartItem(item, product);

    const usedGrams = this.getUsedStockGrams(item.productId);

    const requestedGrams =
      this.getWeightInGrams(item.weight) * item.quantity;

    const availableGrams = product.stock * this.getWeightInGrams(product.weight);

    if (usedGrams + requestedGrams > availableGrams) {
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

    const existingItem = this.items.find(
      cartItem =>
        cartItem.productId === item.productId &&
        cartItem.weight === item.weight
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;

      existingItem.price = updatedItem.price;
      existingItem.oldPrice = updatedItem.oldPrice;
      existingItem.name = updatedItem.name;
      existingItem.image = updatedItem.image;
      existingItem.category = updatedItem.category;

    } else {
      this.items.push(updatedItem);
    }

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

    const item = this.items.find(
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

    item.quantity = quantity;

    this.syncCartPrices();
    this.saveCart();

    return {
      success: true,
      message: 'Cart quantity updated successfully.'
    };
  }

  // Remove cart item
  removeItem(productId: number, weight: string): void {

    this.items = this.items.filter(
      item =>
        !(item.productId === productId &&
          item.weight === weight)
    );

    this.saveCart();
  }

  // Get number of cart lines
  getCartCount(): number {
    return this.items.length;
  }

  // Get subtotal using current prices
  getSubtotal(): number {
    this.syncCartPrices();

    return this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  // Get total quantity
  getTotalQuantity(): number {
    return this.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  // Get remaining quantity for selected weight
  getAvailableQuantity(productId: number, weight: string): number {

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
  }

  // Validate entire cart before checkout
  validateCart(): CartActionResult {

    this.syncCartPrices();

    for (const item of this.items) {

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
    this.items = [];
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

    return this.items
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
  private getLatestCartItem(
    item: CartItem,
    product: Product
  ): CartItem {

    const selectedGrams = this.getWeightInGrams(item.weight);
    const baseGrams = this.getWeightInGrams(product.weight);

    const price = Math.round(
      (product.price / baseGrams) * selectedGrams
    );

    const oldPrice = Math.round(
      (product.oldPrice / baseGrams) * selectedGrams
    );

    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      weight: item.weight,
      price,
      oldPrice: Math.max(price, oldPrice),
      quantity: item.quantity
    };
  }

  // Refresh cart prices after Admin changes
  private syncCartPrices(): void {

    this.items = this.items.map(item => {

      const product = this.productService.getProductById(
        item.productId
      );

      if (!product) {
        return item;
      }

      return this.getLatestCartItem(item, product);
    });
  }

  // Save cart
  private saveCart(): void {

    if (!this.isBrowser) return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.items)
      );

      this.cartCount.set(this.getCartCount());

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

}
