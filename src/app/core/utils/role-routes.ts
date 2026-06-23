import { User } from '../../models/user.model';

export const SUPPORTED_ROLES = ['admin', 'instructor', 'student'] as const;

export type SupportedRole = (typeof SUPPORTED_ROLES)[number];

export function isSupportedRole(role: unknown): role is SupportedRole {
  return typeof role === 'string' && (SUPPORTED_ROLES as readonly string[]).includes(role);
}

/** Default route after login for each role. */
export function getDefaultRouteForRole(role: User['role'] | string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'instructor':
      return '/instructor';
    case 'student':
      return '/my-learning-path';
    default:
      return '/login';
  }
}
