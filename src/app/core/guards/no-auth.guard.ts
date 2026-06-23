import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { inject } from '@angular/core';
import { getDefaultRouteForRole, isSupportedRole } from '../utils/role-routes';

export const NoAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        return true;
      }

      if (!isSupportedRole(user.role)) {
        authService.logout();
        return true;
      }

      router.navigate([getDefaultRouteForRole(user.role)]);
      return false;
    })
  );
};
