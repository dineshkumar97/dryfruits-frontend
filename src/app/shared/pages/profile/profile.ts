
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
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

  profileForm!: ProfileFormGroup;

  isEditing = true;
  hasProfile = false;

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: object,
    private router: Router,
  ) {

    this.isBrowser = isPlatformBrowser(platformId);

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

  // Check logged-in user role
  get isAdminProfile(): boolean {

    const user = this.authService.getUser();

    return user?.role === 'ADMIN' || user?.role === 'STAFF';
  }

  // Separate profile storage based on role
  private get storageKey(): string {

    return this.isAdminProfile
      ? 'nutnest-admin-profile'
      : 'nutnest-customer-profile';
  }

  // Form controls
  get f() {
    return this.profileForm.controls;
  }

  // Profile initial
  get profileInitial(): string {

    const name = this.f.name.value.trim();

    return name
      ? name.charAt(0).toUpperCase()
      : 'N';
  }

  // Load profile
  loadProfile(): void {

    if (!this.isBrowser) return;

    try {

      const user = this.authService.getUser();

      if (!user) {
        this.hasProfile = false;
        this.isEditing = true;
        this.profileForm.enable();
        return;
      }

      const savedProfile = localStorage.getItem(this.storageKey);

      const profile: Partial<UserProfile> = savedProfile
        ? JSON.parse(savedProfile)
        : {};

      this.profileForm.patchValue({

        name: user.name || profile.name || '',

        mobile: user.phone || profile.mobile || '',

        email: user.email || profile.email || '',

        address: profile.address || '',

        city: profile.city || '',

        pincode: profile.pincode || '',

        profileImage: profile.profileImage || ''

      });

      this.hasProfile = true;
      this.isEditing = false;

      // Disable fields when viewing profile
      this.profileForm.disable();

    } catch (error) {

      console.error('Unable to load profile:', error);

      this.hasProfile = false;
      this.isEditing = true;
      this.profileForm.enable();

    }

  }

  // Edit profile
  editProfile(): void {

    this.isEditing = true;
    this.successMessage = '';

    // Enable all form fields
    this.profileForm.enable();

  }

  // Save profile
  saveProfile(): void {

    if (this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();
      return;

    }

    if (!this.isBrowser) return;

    try {

      const profile: UserProfile =
        this.profileForm.getRawValue();

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(profile)
      );

      this.hasProfile = true;
      this.isEditing = false;

      // Disable fields after saving
      this.profileForm.disable();

      this.successMessage =
        'Your profile has been updated successfully.';

    } catch (error) {

      console.error('Unable to save profile:', error);

      this.successMessage =
        'Unable to save profile. Please try again.';

    }

  }

  cancelEdit(): void {
    const currentUrl = this.router.url;
    const user = this.authService.getUser();

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

    if (currentUrl.startsWith('/admin-login')) {
      if (isAdmin) {
        this.router.navigate(['/admin-login']);
      } else {
        this.router.navigate(['/home']);
      }
    } else {
      this.router.navigate(['/home']);
    }
  }

}
