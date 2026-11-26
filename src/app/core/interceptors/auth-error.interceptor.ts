
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
const message = String(
  error.error?.message || error.error?.error || error.error || ''
).toLowerCase();

if (message.includes('user not found') || message.includes('missing token')) {
  localStorage.removeItem('nutnest-access-token');
  localStorage.removeItem('nutnest-user');

  void router.navigate(['/login']);
}

      return throwError(() => error);
    })
  );
};
