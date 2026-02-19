import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { inject } from '@angular/core';

export const NoAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        return true;
      } else {
        // User is logged in, redirect to instructor dashboard
        router.navigate(['/instructor']);
        return false;
      }
    })
  );
};
