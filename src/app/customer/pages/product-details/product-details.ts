import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cart } from '../../../core/services/cart';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss'
})
export class ProductDetails {

  productId: number;

  selectedWeight = '250g';
  quantity = 1;

  products = [
    {
      id: 1,
      name: 'Premium California Almonds',
      category: 'Almonds',
      price: 330,
      oldPrice: 380,
      image: 'images/almonds.png',
      description: 'Premium quality California almonds, carefully selected for freshness and taste.'
    },
    {
      id: 2,
      name: 'Premium Whole Cashews',
      category: 'Cashews',
      price: 290,
      oldPrice: 340,
      image: 'images/cashews.png',
      description: 'Delicious whole cashews with a rich, naturally creamy taste.'
    },
    {
      id: 3,
      name: 'Premium Pistachios',
      category: 'Pistachios',
      price: 350,
      oldPrice: 400,
      image: 'images/pistachios.png',
      description: 'Crunchy premium pistachios selected for quality and freshness.'
    },
    {
      id: 4,
      name: 'Premium Black Dates',
      category: 'Dates',
      price: 180,
      oldPrice: 220,
      image: 'images/black_dates.png',
      description: 'Naturally sweet dates with a soft texture.'
    },
    {
      id: 5,
      name: 'Golden Raisins',
      category: 'Raisins',
      price: 150,
      oldPrice: 180,
      image: 'images/golden_raisins.png',
      description: 'Sweet and delicious golden raisins.'
    },
    {
      id: 6,
      name: 'Premium Walnuts',
      category: 'Walnuts',
      price: 320,
      oldPrice: 370,
      image: 'images/walnuts.png',
      description: 'Premium walnuts with a rich taste and crunchy texture.'
    }
  ];

  weights = ['50g', '100g', '250g', '500g', '1kg'];

  product = this.products[0];

  constructor(
    private route: ActivatedRoute,
    private cartService: Cart
  ) {
    this.productId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    const foundProduct = this.products.find(
      item => item.id === this.productId
    );

    if (foundProduct) {
      this.product = foundProduct;
    }
  }

  private getWeightInGrams(): number {
    if (this.selectedWeight === '1kg') {
      return 1000;
    }

    return Number(this.selectedWeight.replace('g', ''));
  }

  get price(): number {
    return Math.round(
      (this.product.price / 250) * this.getWeightInGrams()
    );
  }

  get oldPrice(): number {
    return Math.round(
      (this.product.oldPrice / 250) * this.getWeightInGrams()
    );
  }

  get discountPercentage(): number {
    return Math.round(
      ((this.oldPrice - this.price) / this.oldPrice) * 100
    );
  }

  get savings(): number {
    return this.oldPrice - this.price;
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    this.cartService.addToCart({
      productId: this.product.id,
      name: this.product.name,
      image: this.product.image,
      category: this.product.category,
      weight: this.selectedWeight,
      price: this.price,
      quantity: this.quantity,
      oldPrice: this.oldPrice
    });

    alert('Product added to your cart successfully!');
  }
}