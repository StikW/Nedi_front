import { User } from '../../models/user.model';

/** Default route after login for each role. */
export function getDefaultRouteForRole(role: User['role']): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'instructor':
      return '/instructor';
    case 'meta':
      return '/meta';
    case 'student':
      return '/my-learning-path';
    default:
      return '/login';
  }
}
