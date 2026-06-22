import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { inject } from '@angular/core';
import { getDefaultRouteForRole } from '../utils/role-routes';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url }
        });
        return false;
      }

      // Usuarios Meta solo pueden acceder al panel Meta
      if (user.role === 'meta') {
        router.navigate(['/meta']);
        return false;
      }

      return true;
    })
  );
}; 