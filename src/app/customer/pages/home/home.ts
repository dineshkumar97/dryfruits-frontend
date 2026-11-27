import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CategoryService,
  StoreCategory
} from '../../../core/services/category';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {

  categories: StoreCategory[] = [];

  isLoading = true;
  errorMessage = '';

  constructor(
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {

    this.isLoading = true;
    this.errorMessage = '';
    console.log('kslsslslsl')

    this.categoryService.getActiveCategories().subscribe({

      next: (categories) => {

        console.log('Homepage categories:', categories);

        this.categories = categories.filter(
          category => category.active
        );

        this.isLoading = false;

      },

      error: (error) => {

        console.error('Category API error:', error);

        this.errorMessage = 'Unable to load collections.';

        this.isLoading = false;

      }

    });

  }

  getCategoryImage(category: StoreCategory): string {

    return category.image || 'images/home.png';

  }

}