import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { inject } from '@angular/core';
import { getDefaultRouteForRole } from '../utils/role-routes';

export const InstructorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && user.role === 'instructor') {
        return true;
      } else {
        if (user) {
          router.navigate([getDefaultRouteForRole(user.role)]);
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
