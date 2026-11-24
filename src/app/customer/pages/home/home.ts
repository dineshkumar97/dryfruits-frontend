
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product';
import { CategoryService, StoreCategory } from '../../../core/services/category';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  categories: StoreCategory[] = [];

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) {
    this.loadCategories();
  }

  // Load active categories that contain active products
  loadCategories(): void {

    const activeProducts = this.productService
      .getProducts()
      .filter(product => product.active);

    const availableCategoryNames = new Set(
      activeProducts.map(product => product.category.toLowerCase())
    );

    this.categories = this.categoryService
      .getCategories()
      .filter(category =>
        category.active &&
        availableCategoryNames.has(category.name.toLowerCase())
      );
  }

  // Get category image
  getCategoryImage(category: StoreCategory): string {

    if (category.image) {
      return category.image;
    }

    const product = this.productService
      .getProducts()
      .find(item =>
        item.active &&
        item.category.toLowerCase() === category.name.toLowerCase()
      );

    return product?.image || 'images/home.png';
  }

}
