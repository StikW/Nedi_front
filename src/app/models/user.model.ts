/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: number;
  /** User's email address */
  email: string;
  /** User's full name */
  name: string;
  /** User's role in the system */
  role: 'student' | 'instructor' | 'admin';
  /** When the user account was created */
  createdAt?: Date;
  /** When the user last logged in */
  lastLogin?: Date;
  /** User's token */
  token?: string;
  /** User's password (only for creation/update) */
  password?: string;
  /** Client ID for app integration */
  clientIdApp?: string;
  /** Client Secret for app integration */
  clientSecretApp?: string;
  /** Business Account ID */
  businessAccountId?: string;
  /** Access Token for external services */
  accessToken?: string;
  /** API Key for external services */
  apiKey?: string;
} 