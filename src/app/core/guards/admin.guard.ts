import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { inject } from '@angular/core';
import { getDefaultRouteForRole, isSupportedRole } from '../utils/role-routes';

export const AdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      }

      if (user && !isSupportedRole(user.role)) {
        authService.logout();
        return false;
      }

      if (user) {
        router.navigate([getDefaultRouteForRole(user.role)]);
      } else {
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      }
      return false;
    }),
  );
};
