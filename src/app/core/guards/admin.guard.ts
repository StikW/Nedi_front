import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { inject } from '@angular/core';

export const AdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      } else {
        // Redirect to appropriate dashboard based on user role
        if (user) {
          if (user.role === 'instructor') {
            router.navigate(['/instructor']);
          } else {
            router.navigate(['/']);
          }
        } else {
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url }
          });
        }
        return false;
      }
    })
  );
};
