
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

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
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  loginType: 'customer' | 'admin' = 'customer';

  showPassword = false;

  errorMessage = '';

  loginForm;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {

    this.loginForm = this.fb.group({
      identifier: ['', [
        Validators.required,
        emailOrMobileValidator
      ]],

      password: ['', [
        Validators.required,
        Validators.minLength(6)
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

    console.log('Login Type:', this.loginType);
    console.log('Login Details:', formValue.identifier);

    this.errorMessage =
      'Authentication will be enabled after backend integration.';

  }

}
