
import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Product, ProductService } from '../../../core/services/product';
import { CategoryService } from '../../../core/services/category';
import { Cart as CartService } from '../../../core/services/cart';
import { Toast } from '../../../core/services/toast';
import { Wishlist } from '../../../core/services/wishlist';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products {

  products = signal<Product[]>([]);
  selectedCategory = signal('All Products');

  quantities: Record<number, number> = {};

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private toastService: Toast,
    private wishlistService: Wishlist
  ) {
    this.loadProducts();
  }

  // Available categories
  get categories(): string[] {
    return [
      'All Products',
      ...this.categoryService
        .getCategories()
        .filter(category => category.active)
        .map(category => category.name)
    ];
  }

  // Load all active admin-created products
  loadProducts(): void {
    this.productService.getActiveProducts().subscribe({
      next: (products: Product[]) => {
        this.products.set(products.filter(product => product.active));
        console.log('Customer products loaded:', this.products());
      },
      error: (error) => {
        console.error('Customer products API error:', error);
        this.products.set([]);
        this.toastService.error('Unable to load products. Please try again.');
      }
    });
  }

  // Category filtering
  filteredProducts = computed(() => {
    const category = this.selectedCategory();

    if (category === 'All Products') {
      return this.products();
    }

    return this.products().filter(
      product => product.category === category
    );
  });

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  // Quantity
  getQuantity(product: Product): number {
    return this.quantities[product.id] || 1;
  }

  increaseQuantity(product: Product): void {
    const quantity = this.getQuantity(product);
    const available = this.getAvailableQuantity(product);

    if (quantity < available) {
      this.quantities = {
        ...this.quantities,
        [product.id]: quantity + 1
      };
    } else {
      this.toastService.warning(
        `Only ${available} pack(s) are available.`
      );
    }
  }

  decreaseQuantity(product: Product): void {
    const quantity = this.getQuantity(product);

    if (quantity > 1) {
      this.quantities = {
        ...this.quantities,
        [product.id]: quantity - 1
      };
    }
  }

  // Stock
  // getAvailableQuantity(product: Product): number {
  //   return this.cartService.getAvailableQuantity(
  //     product.id,
  //     product.weight
  //   );
  // }
  getAvailableQuantity(product: Product): number {
  return Math.max(0, Number(product.stock) || 0);
}

  getStockStatus(product: Product): string {
    const available = this.getAvailableQuantity(product);

    if (available <= 0) return 'Out of Stock';
    if (available <= 5) return 'Limited Stock';

    return 'In Stock';
  }

  // Price calculations
  getTotalPrice(product: Product): number {
    return product.price * this.getQuantity(product);
  }

  getTotalOldPrice(product: Product): number {
    return product.oldPrice * this.getQuantity(product);
  }

  getDiscountPercentage(product: Product): number {
    if (product.oldPrice <= 0) return 0;

    return Math.round(
      ((product.oldPrice - product.price) / product.oldPrice) * 100
    );
  }

  getSavings(product: Product): number {
    return this.getTotalOldPrice(product) - this.getTotalPrice(product);
  }

  // Add to cart
  addToCart(product: Product): void {
    const quantity = this.getQuantity(product);
    const available = this.getAvailableQuantity(product);

    if (available <= 0) {
      this.toastService.warning('Sorry, this product is out of stock.');
      return;
    }

    if (quantity > available) {
      this.toastService.warning(
        `Only ${available} pack(s) are available.`
      );
      return;
    }

    const result = this.cartService.addToCart({
      productId: product.id,
      mongoId: product.mongoId,
      name: product.name,
      image: product.image,
      category: product.category,
      weight: product.weight,
      price: product.price,
      oldPrice: product.oldPrice,
      quantity
    });

    if (result.success) {
      this.toastService.success(result.message);

      this.quantities = {
        ...this.quantities,
        [product.id]: 1
      };
    } else {
      this.toastService.warning(result.message);
    }
  }

  // Wishlist
  toggleWishlist(productId: number, event: Event): void {
    event.stopPropagation();

    const product = this.products().find(
      item => item.id === productId
    );

    if (!product) return;

    const alreadyWishlisted =
      this.wishlistService.isInWishlist(productId);

    this.wishlistService.toggleWishlist(product);

    if (alreadyWishlisted) {
      this.toastService.success('Product removed from wishlist.');
    } else {
      this.toastService.success('Product added to wishlist.');
    }
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistService.isInWishlist(productId);
  }
}
