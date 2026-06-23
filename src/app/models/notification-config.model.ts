export interface NotificationConfig {
  whatsappApiVersion: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  whatsappAccessToken: string;
  accessTokenConfigured?: boolean;
  credentialsConfigured?: boolean;
  notificationsEnabled: boolean;
  welcomeTemplateName: string;
  welcomeTemplateLanguage: string;
  welcomeTemplateBodyParams: string;
  dailyTemplateName: string;
  dailyTemplateLanguage: string;
  dailyTemplateBodyParams: string;
  dailySendDays: number[];
  dailySendHour: number;
  dailySendMinute: number;
  weeklyTemplateName: string;
  weeklyTemplateLanguage: string;
  weeklyTemplateBodyParams: string;
  weeklySendDay: number;
  weeklySendHour: number;
  weeklySendMinute: number;
  reminderCronTimezone: string;
  defaultTemplateName: string;
  defaultTemplateLanguage: string;
  defaultTemplateBodyParams: string;
  hasStoredConfig?: boolean;
  updatedAt?: string;
}

export interface MetaTemplateOption {
  name: string;
  language: string;
  status: string;
  category?: string;
  bodyPreview?: string;
  variableCount: number;
}

export interface NotificationConfigTestResult {
  connected: boolean;
  phoneNumber?: string;
  businessAccountId?: string;
  error?: string;
}

export const WEEKDAYS = [
  { value: 0, label: 'Dom', full: 'Domingo' },
  { value: 1, label: 'Lun', full: 'Lunes' },
  { value: 2, label: 'Mar', full: 'Martes' },
  { value: 3, label: 'Mié', full: 'Miércoles' },
  { value: 4, label: 'Jue', full: 'Jueves' },
  { value: 5, label: 'Vie', full: 'Viernes' },
  { value: 6, label: 'Sáb', full: 'Sábado' },
];

export const TEMPLATE_ROLES = {
  welcome: {
    key: 'welcome' as const,
    title: 'Bienvenida al estudiante',
    description: 'Se envía automáticamente al crear o inscribir un estudiante.',
    bodyParams: 'name,instructor_phone',
    placeholders: ['Nombre del estudiante', 'Teléfono del instructor'],
    hasSchedule: false,
  },
  daily: {
    key: 'daily' as const,
    title: 'Recordatorio diario',
    description: 'Recordatorio para retomar el curso en los días que elijas.',
    bodyParams: 'name',
    placeholders: ['Nombre del estudiante'],
    hasSchedule: true,
    scheduleMode: 'multi-day' as const,
  },
  weekly: {
    key: 'weekly' as const,
    title: 'Reflexión semanal',
    description: 'Mensaje semanal en un día fijo de la semana.',
    bodyParams: 'name',
    placeholders: ['Nombre del estudiante'],
    hasSchedule: true,
    scheduleMode: 'weekly' as const,
  },
};

export const TIMEZONE_OPTIONS = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/New_York',
  'UTC',
];
