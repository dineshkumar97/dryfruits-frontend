
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products {

  private readonly wishlistKey = 'nutnest-wishlist';

  wishlistIds: number[] = this.loadWishlist();

  categories = [
    'All Products',
    'Almonds',
    'Cashews',
    'Pistachios',
    'Dates',
    'Raisins',
    'Walnuts'
  ];

  selectedCategory = 'All Products';

  products = [
    {
      id: 1,
      name: 'Premium California Almonds',
      category: 'Almonds',
      weight: '250g',
      price: 330,
      oldPrice: 380,
      image: 'images/almonds.png',

    },
    {
      id: 2,
      name: 'Premium Whole Cashews',
      category: 'Cashews',
      weight: '250g',
      price: 290,
      oldPrice: 340,
      image: 'images/cashews.png'
    },
    {
      id: 3,
      name: 'Premium Pistachios',
      category: 'Pistachios',
      weight: '250g',
      price: 350,
      oldPrice: 400,
      image: 'images/pistachios.png'
    },
    {
      id: 4,
      name: 'Premium Black Dates',
      category: 'Dates',
      weight: '250g',
      price: 180,
      oldPrice: 220,
      image: 'images/black_dates.png'
    },
    {
      id: 5,
      name: 'Golden Raisins',
      category: 'Raisins',
      weight: '250g',
      price: 150,
      oldPrice: 180,
      image: 'images/golden_raisins.png'
    }
    
  ];

  get filteredProducts() {
    if (this.selectedCategory === 'All Products') {
      return this.products;
    }

    return this.products.filter(
      product => product.category === this.selectedCategory
    );
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  toggleWishlist(productId: number, event: Event): void {
    event.stopPropagation();

    if (this.isWishlisted(productId)) {
      this.wishlistIds = this.wishlistIds.filter(id => id !== productId);
    } else {
      this.wishlistIds = [...this.wishlistIds, productId];
    }

    localStorage.setItem(
      this.wishlistKey,
      JSON.stringify(this.wishlistIds)
    );
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistIds.includes(productId);
  }

  private loadWishlist(): number[] {
    try {
      const saved = JSON.parse(
        localStorage.getItem(this.wishlistKey) || '[]'
      );

      return Array.isArray(saved)
        ? saved.filter((id): id is number =>
            Number.isInteger(id) && id > 0
          )
        : [];
    } catch {
      return [];
    }
  }
}
