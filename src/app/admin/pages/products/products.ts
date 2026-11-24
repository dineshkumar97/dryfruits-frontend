
import { Component } from '@angular/core';
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

import { Product, ProductService } from '../../../core/services/product';
import { CategoryService } from '../../../core/services/category';

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
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products {

  products: Product[] = [];

  searchTerm = '';
  selectedCategory = 'All';

  isFormOpen = false;
  isEditing = false;
  editingId: number | null = null;

  formError = '';

  categories: string[] = [];

  // Reactive Form declaration
  productForm!: ProductFormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {

    // Initialize Reactive Form
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

    // Initial data loading
    this.loadCategories();
    this.loadProducts();
  }

  // Load Categories
  loadCategories(): void {

    this.categories = this.categoryService
      .getCategories()
      .map(category => category.name);

  }

  // Load Products
  loadProducts(): void {

    this.products = this.productService.getProducts();

  }

  // Filter Products
  get filteredProducts(): Product[] {

    return this.products.filter(product => {

      const matchesSearch =
        product.name.toLowerCase().includes(
          this.searchTerm.toLowerCase()
        );

      const matchesCategory =
        this.selectedCategory === 'All' ||
        product.category === this.selectedCategory;

      return matchesSearch && matchesCategory;

    });

  }

  // Summary
  get totalProducts(): number {

    return this.products.length;

  }

  get availableProducts(): number {

    return this.products.filter(
      product => product.active
    ).length;

  }

  get totalStock(): number {

    return this.products.reduce(
      (total, product) => total + product.stock,
      0
    );

  }

  // Add Product
  addProduct(): void {

    this.loadCategories();

    this.isEditing = false;
    this.editingId = null;
    this.formError = '';

    this.productForm.reset({

      name: '',
      category: this.categories[0] ?? '',
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

  // Edit Product
  editProduct(product: Product): void {

    this.loadCategories();

    this.isEditing = true;
    this.editingId = product.id;
    this.formError = '';

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

  // Save Product
  saveProduct(): void {

    this.formError = '';

    if (this.productForm.invalid) {

      this.productForm.markAllAsTouched();
      return;

    }

    const formValue = this.productForm.getRawValue();

    if (this.isEditing && this.editingId !== null) {

      this.products = this.products.map(product =>

        product.id === this.editingId

          ? {
              ...product,
              ...formValue,
              id: this.editingId
            }

          : product

      );

    } else {

      const newId = Math.max(
        0,
        ...this.products.map(product => product.id)
      ) + 1;

      const newProduct: Product = {
        ...formValue,
        id: newId
      };

      this.products = [
        ...this.products,
        newProduct
      ];

    }

    this.productService.saveProducts(this.products);

    this.closeForm();

  }

  // Delete Product
  deleteProduct(id: number): void {

    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmed) return;

    this.products = this.products.filter(
      product => product.id !== id
    );

    this.productService.saveProducts(this.products);

  }

  // Toggle Availability
  toggleAvailability(product: Product): void {

    product.active = !product.active;

    this.productService.saveProducts(this.products);

  }

  // Close Popup
  closeForm(): void {

    this.isFormOpen = false;
    this.isEditing = false;
    this.editingId = null;
    this.formError = '';

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
