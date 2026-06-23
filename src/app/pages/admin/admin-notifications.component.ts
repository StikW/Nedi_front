import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationConfigService } from '../../core/services/notification-config.service';
import {
  MetaTemplateOption,
  NotificationConfig,
  TEMPLATE_ROLES,
  TIMEZONE_OPTIONS,
  WEEKDAYS,
} from '../../models/notification-config.model';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.css'],
})
export class AdminNotificationsComponent implements OnInit {
  config: Partial<NotificationConfig> = {
    dailySendDays: [1, 2, 3, 4, 5],
    dailySendHour: 8,
    dailySendMinute: 0,
    weeklySendDay: 5,
    weeklySendHour: 17,
    weeklySendMinute: 0,
    reminderCronTimezone: 'America/Bogota',
    notificationsEnabled: false,
  };

  readonly templateRoles = TEMPLATE_ROLES;
  readonly weekdays = WEEKDAYS;
  readonly timezoneOptions = TIMEZONE_OPTIONS;

  metaTemplates: MetaTemplateOption[] = [];
  templatesUnlocked = false;
  isLoading = true;
  isSavingCredentials = false;
  isSavingAll = false;
  isLoadingTemplates = false;
  isTesting = false;
  saved = false;
  credentialsError = '';
  templatesError = '';
  accessTokenInput = '';
  testResult: { connected: boolean; phoneNumber?: string; businessAccountId?: string; error?: string; hint?: string } | null = null;

  welcomeSelection = '';
  dailySelection = '';
  weeklySelection = '';

  constructor(private notificationConfigService: NotificationConfigService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.isLoading = true;
    this.notificationConfigService.getConfig().subscribe({
      next: (cfg) => {
        this.config = {
          ...this.config,
          ...cfg,
          dailySendDays: cfg.dailySendDays?.length ? [...cfg.dailySendDays] : [1, 2, 3, 4, 5],
        };
        this.accessTokenInput = '';
        this.templatesUnlocked = !!cfg.credentialsConfigured;
        this.syncTemplateSelections();
        this.isLoading = false;

        if (this.templatesUnlocked) {
          this.loadMetaTemplates(false);
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  saveCredentials(): void {
    this.isSavingCredentials = true;
    this.credentialsError = '';
    this.testResult = null;

    const payload: Partial<NotificationConfig> = {
      whatsappApiVersion: this.config.whatsappApiVersion,
      whatsappPhoneNumberId: this.config.whatsappPhoneNumberId,
      whatsappBusinessAccountId: this.config.whatsappBusinessAccountId,
    };
    if (this.accessTokenInput.trim()) {
      payload.whatsappAccessToken = this.accessTokenInput.trim();
    }

    this.notificationConfigService.updateConfig(payload).subscribe({
      next: (cfg) => {
        this.config = { ...this.config, ...cfg };
        this.accessTokenInput = '';
        this.isSavingCredentials = false;
        this.testConnectionAndLoadTemplates();
      },
      error: () => {
        this.credentialsError = 'No se pudieron guardar las credenciales.';
        this.isSavingCredentials = false;
      },
    });
  }

  testConnectionAndLoadTemplates(): void {
    this.isTesting = true;
    this.notificationConfigService.testConnection().subscribe({
      next: (r) => {
        this.testResult = r;
        this.isTesting = false;
        if (r.connected) {
          this.templatesUnlocked = true;
          if (r.businessAccountId) {
            this.config.whatsappBusinessAccountId = r.businessAccountId;
          }
          if (this.config.whatsappBusinessAccountId) {
            this.loadMetaTemplates(true);
          }
        } else {
          this.credentialsError = r.error || 'No se pudo conectar con Meta.';
        }
      },
      error: (err) => {
        this.testResult = { connected: false, error: err?.message || 'Error de conexión' };
        this.credentialsError = this.testResult.error || '';
        this.isTesting = false;
      },
    });
  }

  loadMetaTemplates(showError = true): void {
    this.isLoadingTemplates = true;
    this.templatesError = '';
    this.notificationConfigService.fetchTemplates().subscribe({
      next: (templates) => {
        this.metaTemplates = templates;
        this.isLoadingTemplates = false;
        this.applyDefaultTemplateSelections();
        this.syncTemplateSelections();
      },
      error: (err) => {
        this.isLoadingTemplates = false;
        if (showError) {
          this.templatesError = err?.error?.message || 'No se pudieron cargar las plantillas de Meta.';
        }
      },
    });
  }

  saveAll(): void {
    this.isSavingAll = true;
    this.saved = false;

    this.applySelectionsToConfig();

    const payload: Partial<NotificationConfig> = {
      ...this.config,
      welcomeTemplateBodyParams: TEMPLATE_ROLES.welcome.bodyParams,
      dailyTemplateBodyParams: TEMPLATE_ROLES.daily.bodyParams,
      weeklyTemplateBodyParams: TEMPLATE_ROLES.weekly.bodyParams,
    };

    if (this.accessTokenInput.trim()) {
      payload.whatsappAccessToken = this.accessTokenInput.trim();
    } else {
      delete payload.whatsappAccessToken;
    }

    this.notificationConfigService.updateConfig(payload).subscribe({
      next: (cfg) => {
        this.config = { ...this.config, ...cfg };
        this.accessTokenInput = '';
        this.syncTemplateSelections();
        this.isSavingAll = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.isSavingAll = false;
      },
    });
  }

  toggleNotifications(): void {
    this.config.notificationsEnabled = !this.config.notificationsEnabled;
  }

  toggleDailyDay(day: number): void {
    const days = this.config.dailySendDays || [];
    const idx = days.indexOf(day);
    if (idx >= 0) {
      if (days.length > 1) {
        this.config.dailySendDays = days.filter((d) => d !== day);
      }
    } else {
      this.config.dailySendDays = [...days, day].sort((a, b) => a - b);
    }
  }

  isDailyDaySelected(day: number): boolean {
    return (this.config.dailySendDays || []).includes(day);
  }

  onWelcomeTemplateChange(key: string): void {
    this.welcomeSelection = key;
    this.applyTemplateKey('welcome', key);
  }

  onDailyTemplateChange(key: string): void {
    this.dailySelection = key;
    this.applyTemplateKey('daily', key);
  }

  onWeeklyTemplateChange(key: string): void {
    this.weeklySelection = key;
    this.applyTemplateKey('weekly', key);
  }

  templateKey(name?: string, language?: string): string {
    if (!name) return '';
    return `${name}::${language || 'es_CO'}`;
  }

  templateLabel(t: MetaTemplateOption): string {
    return `${t.name} (${t.language})`;
  }

  formatTime(hour?: number, minute?: number): string {
    const h = String(hour ?? 8).padStart(2, '0');
    const m = String(minute ?? 0).padStart(2, '0');
    return `${h}:${m}`;
  }

  onDailyTimeChange(value: string): void {
    const [h, m] = value.split(':').map(Number);
    this.config.dailySendHour = h;
    this.config.dailySendMinute = m || 0;
  }

  onWeeklyTimeChange(value: string): void {
    const [h, m] = value.split(':').map(Number);
    this.config.weeklySendHour = h;
    this.config.weeklySendMinute = m || 0;
  }

  findMetaTemplate(name?: string, language?: string): MetaTemplateOption | undefined {
    return this.metaTemplates.find((t) => t.name === name && t.language === language);
  }

  private applySelectionsToConfig(): void {
    this.applyTemplateKey('welcome', this.welcomeSelection);
    this.applyTemplateKey('daily', this.dailySelection);
    this.applyTemplateKey('weekly', this.weeklySelection);
  }

  private applyTemplateKey(role: 'welcome' | 'daily' | 'weekly', key: string): void {
    if (!key) return;
    const [name, language] = key.split('::');
    if (role === 'welcome') {
      this.config.welcomeTemplateName = name;
      this.config.welcomeTemplateLanguage = language;
    } else if (role === 'daily') {
      this.config.dailyTemplateName = name;
      this.config.dailyTemplateLanguage = language;
    } else {
      this.config.weeklyTemplateName = name;
      this.config.weeklyTemplateLanguage = language;
    }
  }

  private syncTemplateSelections(): void {
    this.welcomeSelection = this.templateKey(
      this.config.welcomeTemplateName,
      this.config.welcomeTemplateLanguage,
    );
    this.dailySelection = this.templateKey(
      this.config.dailyTemplateName,
      this.config.dailyTemplateLanguage,
    );
    this.weeklySelection = this.templateKey(
      this.config.weeklyTemplateName,
      this.config.weeklyTemplateLanguage,
    );
  }

  /** Pre-selecciona plantillas por nombre conocido si aún no hay selección. */
  private applyDefaultTemplateSelections(): void {
    const defaults: Record<'welcome' | 'daily' | 'weekly', string[]> = {
      welcome: ['nedi_bienvenida_curso', 'bienvenida'],
      daily: ['nedi_recordatorio_diario', 'recordatorio'],
      weekly: ['nedi_reflexion_semanal', 'reflexion', 'semanal'],
    };

    (['welcome', 'daily', 'weekly'] as const).forEach((role) => {
      const currentName =
        role === 'welcome'
          ? this.config.welcomeTemplateName
          : role === 'daily'
            ? this.config.dailyTemplateName
            : this.config.weeklyTemplateName;

      if (currentName) return;

      const match = this.metaTemplates.find((t) =>
        defaults[role].some((hint) => t.name.toLowerCase().includes(hint)),
      );
      if (match) {
        this.applyTemplateKey(role, this.templateKey(match.name, match.language));
      }
    });
  }
}
