import { inject } from '@angular/core';
import {
  CanActivateFn,
  CanActivateChildFn,
  Router
} from '@angular/router';

import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from '../services/auth';

function checkAdminAccess() {

  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Allow SSR to render the route shell.
  // Browser authentication is checked immediately afterward.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const user = authService.getUser();
  const token = authService.getToken();

  console.log('Admin guard user:', user);
  console.log('Admin guard role:', user?.role);

  if (
    token &&
    (
      user?.role?.toUpperCase() === 'ADMIN' ||
      user?.role?.toUpperCase() === 'STAFF'
    )
  ) {
    return true;
  }

  return router.createUrlTree(['/admin-login']);
}

export const adminAuthGuard: CanActivateFn =
  () => checkAdminAccess();

export const adminChildAuthGuard: CanActivateChildFn =
  () => checkAdminAccess();