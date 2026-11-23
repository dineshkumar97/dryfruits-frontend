
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart as CartService } from '../../../core/services/cart';

interface WishlistProduct {
  id: number;
  name: string;
  category: string;
  weight: string;
  price: number;
  oldPrice: number;
  image: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class Wishlist {

  private readonly wishlistKey = 'nutnest-wishlist';

  products: WishlistProduct[] = [
    { id: 1, name: 'Premium California Almonds', category: 'Almonds', weight: '250g', price: 330, oldPrice: 380, image: 'images/almonds.png' },
    { id: 2, name: 'Premium Whole Cashews', category: 'Cashews', weight: '250g', price: 290, oldPrice: 340, image: 'images/cashews.png' },
    { id: 3, name: 'Premium Pistachios', category: 'Pistachios', weight: '250g', price: 350, oldPrice: 400, image: 'images/pistachios.png' },
    { id: 4, name: 'Premium Black Dates', category: 'Dates', weight: '250g', price: 180, oldPrice: 220, image: 'images/dates.png' },
    { id: 5, name: 'Golden Raisins', category: 'Raisins', weight: '250g', price: 150, oldPrice: 180, image: 'images/raisins.png' },
    { id: 6, name: 'Premium Walnuts', category: 'Walnuts', weight: '250g', price: 320, oldPrice: 370, image: 'images/walnuts.png' }
  ];

  wishlistIds: number[] = this.loadWishlist();

  constructor(private cartService: CartService) {}

  get wishlistProducts(): WishlistProduct[] {
    return this.products.filter(product =>
      this.wishlistIds.includes(product.id)
    );
  }

  removeFromWishlist(productId: number): void {
    this.wishlistIds = this.wishlistIds.filter(
      id => id !== productId
    );

    this.saveWishlist();
  }

  addToCart(product: WishlistProduct): void {
    this.cartService.addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      weight: product.weight,
      price: product.price,
      quantity: 1,
      oldPrice: product.oldPrice
    });

    alert('Product added to your cart successfully!');
  }

  private loadWishlist(): number[] {
    try {
      const saved = JSON.parse(
        localStorage.getItem(this.wishlistKey) || '[]'
      );

      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  private saveWishlist(): void {
    localStorage.setItem(
      this.wishlistKey,
      JSON.stringify(this.wishlistIds)
    );
  }
}
