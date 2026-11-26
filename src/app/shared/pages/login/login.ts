
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

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
    private route: ActivatedRoute,
    private authService: AuthService
  ) {

    this.loginType =
      this.route.snapshot.data['loginType'] ?? 'customer';

    this.loginForm = this.fb.group({
      identifier: [''],
      password: ['']
    });

    this.setLoginValidators();

  }

  get identifier() {
    return this.loginForm.get('identifier');
  }

  get password() {
    return this.loginForm.get('password');
  }

  setLoginValidators(): void {

    if (this.loginType === 'customer') {

      this.identifier?.setValidators([
        Validators.required,
        Validators.pattern(/^[6-9][0-9]{9}$/)
      ]);

      this.password?.clearValidators();

    } else {

      this.identifier?.setValidators([
        Validators.required,
        Validators.email
      ]);

      this.password?.setValidators([
        Validators.required,
        Validators.minLength(4)
      ]);

    }

    this.identifier?.updateValueAndValidity();
    this.password?.updateValueAndValidity();

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

    // CUSTOMER LOGIN
    if (this.loginType === 'customer') {

      this.isLoading = true;

      this.authService.checkCustomerMobile(identifier).subscribe({

        next: () => {

          this.isLoading = false;

          this.router.navigate(['/home']);

        },

        error: (error) => {

          console.error('Customer mobile verification error:', error);

          this.errorMessage =
            error.error?.message ||
            'Unable to verify mobile number. Please try again.';

          this.isLoading = false;

        }

      });

      return;
    }

    // ADMIN / STAFF LOGIN
    const password = formValue.password ?? '';

    this.isLoading = true;

    this.authService.login(identifier, password).subscribe({

      next: (response) => {

        const userRole = response.data.role;

        if (!['ADMIN', 'STAFF'].includes(userRole)) {

          this.authService.logout();

          this.errorMessage =
            'You are not authorized to access the admin portal.';

          this.isLoading = false;
          return;

        }

        this.isLoading = false;

        this.router.navigate(['/nutnest-admin']);

      },

      error: (error) => {

        console.error('Admin login error:', error);

        this.errorMessage =
          error.error?.message || 'Invalid email or password.';

        this.isLoading = false;

      }

    });

  }

}
