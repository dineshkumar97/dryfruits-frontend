
import { Component, Inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import {
  CategoryService,
  StoreCategory
} from '../../../core/services/category';

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

  private readonly isBrowser: boolean;

  // =====================================
  // SIGNALS
  // =====================================

  categories = signal<StoreCategory[]>([]);

  searchTerm = signal('');

  isLoading = signal(false);
  isSaving = signal(false);

  pageError = signal('');
  formError = signal('');

  // =====================================
  // COMPUTED SUMMARY
  // =====================================

  totalCategories = computed(
    () => this.categories().length
  );

  activeCategories = computed(
    () => this.categories().filter(
      category => category.active
    ).length
  );

  inactiveCategories = computed(
    () => this.categories().filter(
      category => !category.active
    ).length
  );

  // =====================================
  // FILTERED CATEGORIES
  // =====================================

  filteredCategories = computed(() => {

    const search = this.searchTerm()
      .toLowerCase()
      .trim();

    return this.categories().filter(category =>
      category.name.toLowerCase().includes(search)
    );

  });

  // =====================================
  // POPUP STATE
  // =====================================

  isFormOpen = false;
  isEditing = false;
  editingId: string | null = null;

  categoryForm!: CategoryFormGroup;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
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

    this.loadCategories();

  }

  // =====================================
  // LOAD CATEGORIES
  // =====================================

  loadCategories(): void {

    if (!this.isBrowser) return;

    this.isLoading.set(true);
    this.pageError.set('');

    this.categoryService.getAdminCategories().subscribe({

      next: (categories) => {

        this.categories.set(categories);
        this.isLoading.set(false);

      },

      error: (error: HttpErrorResponse) => {

        console.error('Unable to load categories:', error);

        this.pageError.set(
          error.error?.message ||
          'Unable to load categories. Please try again.'
        );

        this.isLoading.set(false);

      }

    });

  }

  // =====================================
  // ADD CATEGORY
  // =====================================

  addCategory(): void {

    this.isEditing = false;
    this.editingId = null;

    this.formError.set('');

    this.categoryForm.reset({

      name: '',
      description: '',
      image: '',
      active: true

    });

    this.isFormOpen = true;

  }

  // =====================================
  // EDIT CATEGORY
  // =====================================

  editCategory(category: StoreCategory): void {

    this.isEditing = true;
    this.editingId = category.id;

    this.formError.set('');

    this.categoryForm.reset({

      name: category.name,
      description: category.description,
      image: category.image,
      active: category.active

    });

    this.isFormOpen = true;

  }

  // =====================================
  // SAVE CATEGORY
  // =====================================

  saveCategory(): void {

    this.formError.set('');

    if (this.categoryForm.invalid) {

      this.categoryForm.markAllAsTouched();
      return;

    }

    const formValue = this.categoryForm.getRawValue();

    const categoryName = formValue.name.trim();

    // Check Duplicate Category
    const duplicateCategory = this.categories().some(category =>

      category.name.toLowerCase() === categoryName.toLowerCase() &&
      category.id !== this.editingId

    );

    if (duplicateCategory) {

      this.formError.set('This category already exists.');
      return;

    }

    const categoryData = {

      name: categoryName,
      description: formValue.description.trim(),
      image: formValue.image.trim(),
      active: formValue.active

    };

    this.isSaving.set(true);

    // UPDATE CATEGORY
    if (this.isEditing && this.editingId !== null) {

      this.categoryService.updateCategory(
        this.editingId,
        categoryData
      ).subscribe({

        next: (updatedCategory) => {

          this.categories.update(categories =>
            categories.map(category =>
              category.id === updatedCategory.id
                ? updatedCategory
                : category
            )
          );

          this.isSaving.set(false);

          this.closeForm();

        },

        error: (error: HttpErrorResponse) => {

          this.handleSaveError(error);

        }

      });

    }

    // CREATE CATEGORY
    else {

      this.categoryService.createCategory(
        categoryData
      ).subscribe({

        next: (newCategory) => {

          this.categories.update(categories => [
            newCategory,
            ...categories
          ]);

          this.isSaving.set(false);

          this.closeForm();

        },

        error: (error: HttpErrorResponse) => {

          this.handleSaveError(error);

        }

      });

    }

  }

  // =====================================
  // HANDLE SAVE ERROR
  // =====================================

  private handleSaveError(error: HttpErrorResponse): void {

    console.error('Category save error:', error);

    this.formError.set(
      error.error?.message ||
      'Unable to save category. Please try again.'
    );

    this.isSaving.set(false);

  }

  // =====================================
  // DELETE CATEGORY
  // =====================================

  deleteCategory(id: string): void {

    if (!this.isBrowser) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this category?'
    );

    if (!confirmed) return;

    this.categoryService.deleteCategory(id).subscribe({

      next: () => {

        this.categories.update(categories =>
          categories.filter(category => category.id !== id)
        );

      },

      error: (error: HttpErrorResponse) => {

        console.error('Delete category error:', error);

        window.alert(
          error.error?.message ||
          'Unable to delete category. Please try again.'
        );

      }

    });

  }

  // =====================================
  // TOGGLE AVAILABILITY
  // =====================================

  toggleAvailability(category: StoreCategory): void {

    const updatedStatus = !category.active;

    this.categoryService.updateCategory(
      category.id,
      {
        active: updatedStatus
      }
    ).subscribe({

      next: (updatedCategory) => {

        this.categories.update(categories =>
          categories.map(item =>
            item.id === updatedCategory.id
              ? updatedCategory
              : item
          )
        );

      },

      error: (error: HttpErrorResponse) => {

        console.error('Category status error:', error);

        window.alert(
          error.error?.message ||
          'Unable to update category status.'
        );

      }

    });

  }

  // =====================================
  // CLOSE POPUP
  // =====================================

  closeForm(): void {

    this.isFormOpen = false;
    this.isEditing = false;
    this.editingId = null;

    this.formError.set('');
    this.isSaving.set(false);

    this.categoryForm.reset({

      name: '',
      description: '',
      image: '',
      active: true

    });

  }

}
