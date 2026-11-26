
import {
  Component,
  Inject,
  signal,
  computed,
  PLATFORM_ID
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import {
  Product,
  ProductService
} from '../../../core/services/product';

import {
  CategoryService,
  StoreCategory
} from '../../../core/services/category';

// Typed Product Form
type ProductFormGroup = FormGroup<{
  name: FormControl<string>;
  category: FormControl<string>;
  image: FormControl<string>;
  description: FormControl<string>;
  weight: FormControl<string>;
  price: FormControl<number>;
  oldPrice: FormControl<number>;
  stock: FormControl<number>;
  active: FormControl<boolean>;
}>;

// Original price must be >= selling price
const priceValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const price = Number(control.get('price')?.value);
  const oldPrice = Number(control.get('oldPrice')?.value);

  if (!price || !Number.isFinite(oldPrice)) {
    return null;
  }

  return oldPrice >= price
    ? null
    : { invalidPrice: true };
};

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products {

  private readonly isBrowser: boolean;

  // SIGNALS

  products = signal<Product[]>([]);

  categories = signal<string[]>([]);

  searchTerm = signal('');

  selectedCategory = signal('All');

  isLoading = signal(false);

  isSaving = signal(false);

  pageError = signal('');

  formError = signal('');

  // COMPUTED PRODUCTS

  filteredProducts = computed(() => {

    const search = this.searchTerm()
      .toLowerCase()
      .trim();

    const category = this.selectedCategory();

    return this.products().filter(product => {

      const matchesSearch =
        product.name.toLowerCase().includes(search);

      const matchesCategory =
        category === 'All' ||
        product.category === category;

      return matchesSearch && matchesCategory;

    });

  });

  // COMPUTED SUMMARY

  totalProducts = computed(
    () => this.products().length
  );

  availableProducts = computed(
    () => this.products().filter(
      product => product.active
    ).length
  );

  totalStock = computed(
    () => this.products().reduce(
      (total, product) => total + product.stock,
      0
    )
  );

  // POPUP STATE

  isFormOpen = false;

  isEditing = false;

  editingId: string | null = null;

  productForm!: ProductFormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) platformId: object
  ) {

    this.isBrowser = isPlatformBrowser(platformId);

    // INITIALIZE REACTIVE FORM
    this.productForm = this.fb.nonNullable.group({

      name: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],

      category: ['', [
        Validators.required
      ]],

      image: [''],

      description: [''],

      weight: ['250g', [
        Validators.required,
        Validators.pattern(/^(50g|100g|250g|500g|1kg)$/)
      ]],

      price: [0, [
        Validators.required,
        Validators.min(1)
      ]],

      oldPrice: [0, [
        Validators.required,
        Validators.min(0)
      ]],

      stock: [0, [
        Validators.required,
        Validators.min(0)
      ]],

      active: [true]

    }, {
      validators: priceValidator
    });

    // INITIAL DATA LOADING
    this.loadCategories();
    this.loadProducts();

  }

  // CATEGORY IMAGE MAPPING

  onCategoryChange(): void {

    const category =
      this.productForm.controls.category.value;

    const categoryImages: Record<string, string> = {

      'Premium Seedless Dates': 'images/black_dates.png',

      'Premium Walnut Kernels': 'images/walnuts.png',

      'Golden Raisins': 'images/golden_raisins.png',

      'Premium Iranian Pistachios': 'images/pistachios.png',

      'Premium Whole Cashews': 'images/cashews.png',

      'Dry Mix Fruits': 'images/dry_mix.png'

    };

    this.productForm.patchValue({
      image: categoryImages[category] || ''
    });

  }

  // IMAGE PREVIEW ERROR

  onPreviewError(event: Event): void {

    const image = event.target as HTMLImageElement;

    image.style.display = 'none';

  }

  // LOAD CATEGORIES

  loadCategories(): void {

    if (!this.isBrowser) return;

    this.categoryService.getAdminCategories().subscribe({

      next: (categories: StoreCategory[]) => {

        const activeCategories = categories
          .filter(category => category.active)
          .map(category => category.name);

        this.categories.set(activeCategories);

        if (
          this.isFormOpen &&
          !this.isEditing &&
          !this.productForm.controls.category.value
        ) {

          this.productForm.controls.category.setValue(
            activeCategories[0] ?? ''
          );

        }

      },

      error: (error: HttpErrorResponse) => {

        console.error('Unable to load categories:', error);

        this.pageError.set(
          error.error?.message ||
          'Unable to load product categories.'
        );

      }

    });

  }

  // LOAD PRODUCTS

  loadProducts(): void {

    if (!this.isBrowser) return;

    this.isLoading.set(true);

    this.pageError.set('');

    this.productService.getAdminProducts().subscribe({

      next: (products: Product[]) => {

        this.products.set(products);

        this.isLoading.set(false);

      },

      error: (error: HttpErrorResponse) => {

        console.error('Unable to load products:', error);

        this.pageError.set(
          error.error?.message ||
          'Unable to load products. Please try again.'
        );

        this.isLoading.set(false);

      }

    });

  }

  // ADD PRODUCT

  addProduct(): void {

    this.loadCategories();

    this.isEditing = false;

    this.editingId = null;

    this.formError.set('');

    this.productForm.reset({

      name: '',
      category: this.categories()[0] ?? '',
      image: '',
      description: '',
      weight: '250g',
      price: 0,
      oldPrice: 0,
      stock: 0,
      active: true

    });

    this.isFormOpen = true;

  }

  // EDIT PRODUCT

  editProduct(product: Product): void {

    this.loadCategories();

    if (!product.mongoId) {

      this.formError.set(
        'Invalid MongoDB product ID. Please reload products.'
      );

      return;

    }

    this.isEditing = true;

    this.editingId = product.mongoId;

    this.formError.set('');

    this.productForm.reset({

      name: product.name,
      category: product.category,
      image: product.image,
      description: product.description,
      weight: product.weight,
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock,
      active: product.active

    });

    this.isFormOpen = true;

  }

  // SAVE PRODUCT

  saveProduct(): void {

    this.formError.set('');

    if (this.productForm.invalid) {

      this.productForm.markAllAsTouched();

      return;

    }

    const formValue = this.productForm.getRawValue();

    const productData = {

      name: formValue.name.trim(),

      category: formValue.category,

      image: formValue.image.trim(),

      description: formValue.description.trim(),

      weight: formValue.weight,

      price: formValue.price,

      oldPrice: formValue.oldPrice,

      stock: formValue.stock,

      active: formValue.active

    };

    this.isSaving.set(true);

    // UPDATE PRODUCT

    if (this.isEditing && this.editingId !== null) {

      this.productService.updateProduct(
        this.editingId,
        productData
      ).subscribe({

        next: (updatedProduct) => {

          this.products.update(products =>
            products.map(product =>
              product.mongoId === updatedProduct.mongoId
                ? updatedProduct
                : product
            )
          );

          this.isSaving.set(false);

          this.closeForm();

        },

        error: (error: HttpErrorResponse) => {

          this.handleSaveError(error);

        }

      });

    } else {

      // CREATE PRODUCT

      this.productService.createProduct(
        productData
      ).subscribe({

        next: (newProduct) => {

          this.products.update(products => [
            newProduct,
            ...products
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

  // HANDLE SAVE ERROR

  private handleSaveError(error: HttpErrorResponse): void {

    console.error('Product save error:', error);

    this.formError.set(
      error.error?.message ||
      'Unable to save product. Please try again.'
    );

    this.isSaving.set(false);

  }

  // DELETE PRODUCT

  deleteProduct(id: number): void {

    const product = this.products().find(
      item => item.id === id
    );

    if (!product?.mongoId) {

      window.alert(
        'Product ID is missing. Please reload the product list.'
      );

      return;

    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmed) return;

    this.productService.deleteProduct(
      product.mongoId
    ).subscribe({

      next: () => {

        this.products.update(products =>
          products.filter(
            item => item.mongoId !== product.mongoId
          )
        );

      },

      error: (error: HttpErrorResponse) => {

        console.error('Delete product error:', error);

        window.alert(
          error.error?.message ||
          'Unable to delete product. Please try again.'
        );

      }

    });

  }

  // TOGGLE PRODUCT AVAILABILITY

  toggleAvailability(product: Product): void {

    if (!product.mongoId) {

      window.alert(
        'Product ID is missing. Please reload products.'
      );

      return;

    }

    const updatedStatus = !product.active;

    this.productService.updateProduct(
      product.mongoId,
      {
        active: updatedStatus
      }
    ).subscribe({

      next: (updatedProduct) => {

        this.products.update(products =>
          products.map(item =>
            item.mongoId === updatedProduct.mongoId
              ? updatedProduct
              : item
          )
        );

      },

      error: (error: HttpErrorResponse) => {

        console.error('Product status update error:', error);

        window.alert(
          error.error?.message ||
          'Unable to update product availability.'
        );

      }

    });

  }

  // CLOSE POPUP

  closeForm(): void {

    this.isFormOpen = false;

    this.isEditing = false;

    this.editingId = null;

    this.formError.set('');

    this.isSaving.set(false);

    this.productForm.reset({

      name: '',
      category: '',
      image: '',
      description: '',
      weight: '250g',
      price: 0,
      oldPrice: 0,
      stock: 0,
      active: true

    });

  }

}
