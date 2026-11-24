
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

interface AdminCategory {
  id: number;
  name: string;
  description: string;
  image: string;
  active: boolean;
}

type CategoryFormGroup = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  image: FormControl<string>;
  active: FormControl<boolean>;
}>;

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class Categories {

  private readonly storageKey = 'nutnest-admin-categories';
  private readonly isBrowser: boolean;

  categories: AdminCategory[] = [];

  searchTerm = '';

  isFormOpen = false;
  isEditing = false;
  editingId: number | null = null;

  formError = '';

  // Reactive Form
  categoryForm!: CategoryFormGroup;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: object
  ) {

    this.isBrowser = isPlatformBrowser(platformId);

    // Initialize Reactive Form
    this.categoryForm = this.fb.nonNullable.group({

      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],

      description: [''],

      image: [''],

      active: [true]

    });

    if (this.isBrowser) {
      this.loadCategories();
    }
  }

  // Filter Categories
  get filteredCategories(): AdminCategory[] {
    return this.categories.filter(category =>
      category.name.toLowerCase().includes(
        this.searchTerm.toLowerCase()
      )
    );
  }

  // Summary
  get totalCategories(): number {
    return this.categories.length;
  }

  get activeCategories(): number {
    return this.categories.filter(
      category => category.active
    ).length;
  }

  get inactiveCategories(): number {
    return this.categories.filter(
      category => !category.active
    ).length;
  }

  // Load Categories
  private loadCategories(): void {

    try {

      const savedCategories = localStorage.getItem(
        this.storageKey
      );

      if (savedCategories) {
        const parsed: unknown = JSON.parse(savedCategories);

        this.categories = Array.isArray(parsed)
          ? parsed
          : [];
      }

    } catch (error) {

      console.error('Unable to load categories:', error);
      this.categories = [];

    }
  }

  // Save Categories
  private saveToStorage(): void {

    if (!this.isBrowser) return;

    try {

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.categories)
      );

    } catch (error) {

      console.error('Unable to save categories:', error);

    }
  }

  // Add Category
  addCategory(): void {

    this.isEditing = false;
    this.editingId = null;
    this.formError = '';

    this.categoryForm.reset({

      name: '',
      description: '',
      image: '',
      active: true

    });

    this.isFormOpen = true;
  }

  // Edit Category
  editCategory(category: AdminCategory): void {

    this.isEditing = true;
    this.editingId = category.id;
    this.formError = '';

    this.categoryForm.reset({

      name: category.name,
      description: category.description,
      image: category.image,
      active: category.active

    });

    this.isFormOpen = true;
  }

  // Save Category
  saveCategory(): void {

    this.formError = '';

    if (this.categoryForm.invalid) {

      this.categoryForm.markAllAsTouched();
      return;

    }

    const formValue = this.categoryForm.getRawValue();
    const categoryName = formValue.name.trim();

    // Duplicate Category Validation
    const duplicateCategory = this.categories.some(category =>

      category.name.toLowerCase() === categoryName.toLowerCase() &&
      category.id !== this.editingId

    );

    if (duplicateCategory) {

      this.formError = 'This category already exists.';
      return;

    }

    if (this.isEditing && this.editingId !== null) {

      this.categories = this.categories.map(category =>

        category.id === this.editingId

          ? {
              ...category,
              ...formValue,
              name: categoryName,
              id: this.editingId
            }

          : category

      );

    } else {

      const newCategory: AdminCategory = {

        ...formValue,
        id: Date.now(),
        name: categoryName

      };

      this.categories = [
        ...this.categories,
        newCategory
      ];

    }

    this.saveToStorage();
    this.closeForm();

  }

  // Delete Category
  deleteCategory(id: number): void {

    if (!this.isBrowser) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this category?'
    );

    if (!confirmed) return;

    this.categories = this.categories.filter(
      category => category.id !== id
    );

    this.saveToStorage();

  }

  // Toggle Availability
  toggleAvailability(category: AdminCategory): void {

    category.active = !category.active;

    this.saveToStorage();

  }

  // Close Form
  closeForm(): void {

    this.isFormOpen = false;
    this.isEditing = false;
    this.editingId = null;
    this.formError = '';

    this.categoryForm.reset({

      name: '',
      description: '',
      image: '',
      active: true

    });

  }

}
