
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ContactService } from '../../../core/services/contact';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {

  contactForm: FormGroup;
  isLoading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private toast: Toast
  ) {

    this.contactForm = this.fb.group({

      fullName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z ]+$/)
      ]],

      mobile: ['', [
        Validators.required,
        Validators.pattern(/^(?:\+91)?[6-9]\d{9}$/)
      ]],

      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(150)
      ]],

      subject: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(150)
      ]],

      message: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]]

    });

  }

  get f() {
    return this.contactForm.controls;
  }

  showError(field: string): boolean {
    return this.f[field].invalid &&
      (this.f[field].touched || this.submitted);
  }

  onSubmit(): void {

    this.submitted = true;

    if (this.contactForm.invalid || this.isLoading) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const contactData = this.contactForm.getRawValue();

    this.contactService.submitContact(contactData).subscribe({

      next: (response) => {

        this.isLoading = false;

        if (response.success) {

          this.toast.success(
            response.message || 'Your message has been submitted successfully.'
          );

          this.contactForm.reset();
          this.submitted = false;

        } else {

          this.toast.error(
            response.message || 'Unable to submit your message.'
          );

        }

      },

      error: (error: HttpErrorResponse) => {

        this.isLoading = false;

        const errorMessage =
          error.error?.message ||
          'Something went wrong. Please try again later.';

        this.toast.error(errorMessage);

        console.error('Contact API error:', error);

      }

    });

  }

}
