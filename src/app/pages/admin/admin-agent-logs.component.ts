import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAgentService, AgentActivityEntry } from '../../core/services/admin-agent.service';

@Component({
  selector: 'app-admin-agent-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-agent-logs.component.html',
  styleUrls: ['./admin-agent-logs.component.css'],
})
export class AdminAgentLogsComponent implements OnInit, OnDestroy {
  private static readonly MAX_ACTIVITY_ENTRIES = 80;
  private static readonly MAX_FILE_LINES = 120;

  entries: AgentActivityEntry[] = [];
  fileLines: string[] = [];
  logFilePath: string | null = null;
  fileMessage = '';

  filterInstance = '';
  isLoading = false;
  error = '';

  @ViewChild('activityViewport') activityViewport?: ElementRef<HTMLElement>;
  @ViewChild('fileViewport') fileViewport?: ElementRef<HTMLElement>;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private stickActivityToTop = true;

  constructor(private adminAgent: AdminAgentService) {}

  ngOnInit(): void {
    this.refresh();
    this.pollTimer = setInterval(() => this.refresh(true), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  refresh(silent = false): void {
    if (!silent) this.isLoading = true;
    this.error = '';

    const instance = this.filterInstance.trim() || undefined;
    const prevActivityScroll = this.activityViewport?.nativeElement.scrollTop ?? 0;

    this.adminAgent.listActivity(150, instance).subscribe({
      next: (res) => {
        this.entries = res.entries.slice(0, AdminAgentLogsComponent.MAX_ACTIVITY_ENTRIES);
        if (!silent) this.isLoading = false;
        if (this.stickActivityToTop) {
          setTimeout(() => this.scrollActivityToTop(), 30);
        } else if (this.activityViewport?.nativeElement) {
          this.activityViewport.nativeElement.scrollTop = prevActivityScroll;
        }
      },
      error: (err: Error) => {
        if (!silent) this.error = err.message;
        if (!silent) this.isLoading = false;
      },
    });

    this.adminAgent.tailLogFile(250).subscribe({
      next: (res) => {
        this.fileLines = res.lines.slice(-AdminAgentLogsComponent.MAX_FILE_LINES);
        this.logFilePath = res.file;
        this.fileMessage = res.message || '';
        setTimeout(() => this.scrollFileToBottom(), 30);
      },
      error: () => undefined,
    });
  }

  onActivityScroll(): void {
    const el = this.activityViewport?.nativeElement;
    if (!el) return;
    this.stickActivityToTop = el.scrollTop < 24;
  }

  scrollActivityToTop(): void {
    const el = this.activityViewport?.nativeElement;
    if (el) el.scrollTop = 0;
    this.stickActivityToTop = true;
  }

  scrollFileToBottom(): void {
    const el = this.fileViewport?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  eventLabel(event: string): string {
    const labels: Record<string, string> = {
      message_received: 'Mensaje recibido',
      message_sent: 'Respuesta enviada',
      send_failed: 'Envío fallido',
      agent_error: 'Error del agente',
      webhook_ignored: 'Webhook ignorado',
      self_chat: 'Self-chat (mismo número instructor)',
    };
    return labels[event] || event;
  }

  levelClass(level: string): string {
    return `level-${level}`;
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString('es-CO');
  }
}
