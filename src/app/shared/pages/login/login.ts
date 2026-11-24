
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

const emailOrMobileValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const value = String(control.value ?? '').trim();

  if (!value) return null;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobilePattern = /^[6-9][0-9]{9}$/;

  return emailPattern.test(value) || mobilePattern.test(value)
    ? null
    : { invalidEmailOrMobile: true };
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  loginType: 'customer' | 'admin' = 'customer';

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  loginForm;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {

    this.loginForm = this.fb.group({
      identifier: ['', [
        Validators.required,
        emailOrMobileValidator
      ]],

      password: ['', [
        Validators.required,
        Validators.minLength(4)
      ]]
    });

  }

  get identifier() {
    return this.loginForm.get('identifier');
  }

  get password() {
    return this.loginForm.get('password');
  }

  selectLoginType(type: 'customer' | 'admin'): void {

    this.loginType = type;
    this.loginForm.reset();

    this.showPassword = false;
    this.errorMessage = '';

  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {

    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const formValue = this.loginForm.getRawValue();

    const identifier = formValue.identifier?.trim() ?? '';
    const password = formValue.password ?? '';

    // Backend currently supports email login only
    if (!identifier.includes('@')) {
      this.errorMessage = 'Please enter your registered email address.';
      return;
    }

    this.isLoading = true;

    this.authService.login(identifier, password).subscribe({

      next: (response) => {

        const userRole = response.data.role;

        if (
          this.loginType === 'admin' &&
          !['ADMIN', 'STAFF'].includes(userRole)
        ) {
          this.authService.logout();
          this.errorMessage = 'You are not authorized to access the admin portal.';
          this.isLoading = false;
          return;
        }

        if (
          this.loginType === 'customer' &&
          userRole !== 'CUSTOMER'
        ) {
          this.authService.logout();
          this.errorMessage = 'Please use the admin login option.';
          this.isLoading = false;
          return;
        }

        this.isLoading = false;

        if (userRole === 'ADMIN' || userRole === 'STAFF') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }

      },

      error: (error) => {

        console.error('Login error:', error);

        this.errorMessage =
          error.error?.message || 'Invalid email or password.';

        this.isLoading = false;

      }

    });

  }

}
