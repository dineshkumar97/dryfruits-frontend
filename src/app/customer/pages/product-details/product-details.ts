
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Cart } from '../../../core/services/cart';
import { Product, ProductService } from '../../../core/services/product';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss'
})
export class ProductDetails {

  productId = 0;

  selectedWeight = '250g';
  quantity = 1;

  successMessage = '';
  errorMessage = '';

  weights = ['50g', '100g', '250g', '500g', '1kg'];

  product: Product = {
    id: 0,
    name: '',
    category: '',
    weight: '250g',
    price: 0,
    oldPrice: 0,
    image: '',
    description: '',
    stock: 0,
    active: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: Cart,
    private productService: ProductService
  ) {
    this.productId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    const foundProduct = this.productService.getProductById(
      this.productId
    );

    if (foundProduct && foundProduct.active) {
      this.product = foundProduct;

      if (this.weights.includes(foundProduct.weight)) {
        this.selectedWeight = foundProduct.weight;
      }
    } else {
      this.router.navigate(['/products']);
    }
  }

  private getWeightInGrams(weight: string): number {
    if (weight === '1kg') {
      return 1000;
    }

    return Number(weight.replace('g', ''));
  }

  private getBaseWeightInGrams(): number {
    return this.getWeightInGrams(this.product.weight);
  }

  // Current selling price
  get price(): number {
    return Math.round(
      (this.product.price / this.getBaseWeightInGrams()) *
      this.getWeightInGrams(this.selectedWeight)
    );
  }

  // Original price
  get oldPrice(): number {
    return Math.round(
      (this.product.oldPrice / this.getBaseWeightInGrams()) *
      this.getWeightInGrams(this.selectedWeight)
    );
  }

  // Discount percentage
  get discountPercentage(): number {
    if (this.oldPrice <= 0) return 0;

    return Math.round(
      ((this.oldPrice - this.price) / this.oldPrice) * 100
    );
  }

  get savings(): number {
    return this.oldPrice - this.price;
  }

  // Available quantity for selected weight
  get availableQuantity(): number {
    return this.cartService.getAvailableQuantity(
      this.product.id,
      this.selectedWeight
    );
  }

  get stockStatus(): string {
    if (this.availableQuantity === 0) {
      return 'Out of Stock';
    }

    if (this.availableQuantity <= 5) {
      return 'Limited Stock';
    }

    return 'In Stock';
  }

  // Change selected weight
  selectWeight(weight: string): void {
    this.selectedWeight = weight;
    this.quantity = 1;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Increase quantity
  increaseQuantity(): void {

    this.successMessage = '';

    if (this.quantity < this.availableQuantity) {
      this.quantity++;
      this.errorMessage = '';
    } else {
      this.errorMessage = this.availableQuantity === 0
        ? 'This product is currently out of stock.'
        : `Only ${this.availableQuantity} more pack(s) are available.`;
    }
  }

  // Decrease quantity
  decreaseQuantity(): void {

    if (this.quantity > 1) {
      this.quantity--;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  // Add product to cart
  addToCart(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (this.availableQuantity < 1) {
      this.errorMessage = 'Sorry, this product is currently out of stock.';
      return;
    }

    if (this.quantity > this.availableQuantity) {
      this.errorMessage =
        `Only ${this.availableQuantity} pack(s) are available.`;
      return;
    }

    const result = this.cartService.addToCart({
      productId: this.product.id,
      name: this.product.name,
      image: this.product.image,
      category: this.product.category,
      weight: this.selectedWeight,
      price: this.price,
      quantity: this.quantity,
      oldPrice: this.oldPrice
    });

    if (result.success) {
      this.successMessage = result.message;
    } else {
      this.errorMessage = result.message;
    }
  }

}
