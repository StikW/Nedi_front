/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's full name */
  name: string;
  /** User's role in the system */
  role: 'student' | 'instructor' | 'admin';
  /** Whether the account is active */
  isActive?: boolean;
  /**
   * Phone number in E.164 format (e.g. +573001234567).
   * Solo aplica a instructores: es el n\u00famero del "tutor NEDI" que se inserta
   * en la plantilla de bienvenida de WhatsApp (`nedi_bienvenida_curso`).
   */
  phoneNumber?: string;
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
  /** Instancia Evolution del instructor (p.ej. nedi_<id>) */
  evolutionInstance?: string;
  /** Numero de WhatsApp vinculado a Evolution (E.164 sin +) */
  evolutionNumber?: string;
  /** Estado de conexion Evolution */
  evolutionStatus?: 'disconnected' | 'connecting' | 'connected';
} 