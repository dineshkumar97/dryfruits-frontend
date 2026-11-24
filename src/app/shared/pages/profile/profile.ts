
import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
interface UserProfile {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  profileImage: string;
}

type ProfileFormGroup = FormGroup<{
  name: FormControl<string>;
  mobile: FormControl<string>;
  email: FormControl<string>;
  address: FormControl<string>;
  city: FormControl<string>;
  pincode: FormControl<string>;
  profileImage: FormControl<string>;
}>;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

  private readonly isBrowser: boolean;
private get storageKey(): string {
  return this.isAdminProfile
    ? 'nutnest-admin-profile'
    : 'nutnest-customer-profile';
}

get isAdminProfile(): boolean {
  return this.router.url.startsWith('/admin/');
}
  profileForm!: ProfileFormGroup;

  isEditing = true;
  hasProfile = false;

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object
  ) {

    this.isBrowser = isPlatformBrowser(platformId);

    // Initialize Reactive Form
    this.profileForm = this.fb.nonNullable.group({

      name: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],

      mobile: ['', [
        Validators.required,
        Validators.pattern('^[6-9][0-9]{9}$')
      ]],

      email: ['', [
        Validators.email
      ]],

      address: [''],

      city: [''],

      pincode: ['', [
        Validators.pattern('^[0-9]{6}$')
      ]],

      profileImage: ['']

    });

    this.loadProfile();
  }

  // Load Profile
  loadProfile(): void {

    if (!this.isBrowser) return;

    try {

      const savedProfile = localStorage.getItem(
        this.storageKey
      );

      if (!savedProfile) return;

      const profile: UserProfile = JSON.parse(savedProfile);

      this.profileForm.patchValue({

        name: profile.name ?? '',
        mobile: profile.mobile ?? '',
        email: profile.email ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        pincode: profile.pincode ?? '',
        profileImage: profile.profileImage ?? ''

      });

      this.hasProfile = true;
      this.isEditing = false;

    } catch (error) {

      console.error('Unable to load profile:', error);

    }

  }

  // Get Profile Form Controls
  get f() {
    return this.profileForm.controls;
  }

  // Get Profile Initial
  get profileInitial(): string {

    const name = this.f.name.value.trim();

    return name
      ? name.charAt(0).toUpperCase()
      : 'N';

  }

  // Open Edit Mode
  editProfile(): void {

    this.isEditing = true;
    this.successMessage = '';

    this.profileForm.enable();

  }

  // Save Profile
  saveProfile(): void {

    if (this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();
      return;

    }

    const profile: UserProfile =
      this.profileForm.getRawValue();

    try {

      if (!this.isBrowser) return;

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(profile)
      );

      this.hasProfile = true;
      this.isEditing = false;

      this.profileForm.disable();

      this.successMessage =
        'Your profile has been updated successfully.';

    } catch (error) {

      console.error('Unable to save profile:', error);

      this.successMessage =
        'Unable to save profile. Please try again.';

    }

  }

  // Cancel Editing
  cancelEdit(): void {

    if (this.hasProfile) {

      this.loadProfile();
      this.successMessage = '';
      this.profileForm.disable();

    } else {

      this.profileForm.reset();
      this.profileForm.enable();

    }

    this.isEditing = !this.hasProfile;

  }

}
