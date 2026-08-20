import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminAgentService,
  ChatMessageView,
  ChatSummary,
  InstructorConversationSummary,
} from '../../core/services/admin-agent.service';

@Component({
  selector: 'app-admin-conversations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-conversations.component.html',
  styleUrls: ['./admin-conversations.component.css'],
})
export class AdminConversationsComponent implements OnInit, OnDestroy {
  private static readonly MAX_VISIBLE_MESSAGES = 80;
  private static readonly MESSAGES_PAGE_SIZE = 50;

  instructors: InstructorConversationSummary[] = [];
  chats: ChatSummary[] = [];
  messages: ChatMessageView[] = [];
  chatsSource: 'evolution' | 'activity_log' | null = null;

  selectedInstructor: InstructorConversationSummary | null = null;
  selectedChat: ChatSummary | null = null;

  isLoadingInstructors = false;
  isLoadingChats = false;
  isLoadingMessages = false;
  isLoadingOlderMessages = false;
  hasOlderMessages = false;
  error = '';

  messagesPage = 1;

  @ViewChild('messagesViewport') messagesViewport?: ElementRef<HTMLElement>;

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private stickToBottom = true;

  constructor(private adminAgent: AdminAgentService) {}

  ngOnInit(): void {
    this.loadInstructors();
    this.refreshTimer = setInterval(() => {
      if (this.selectedInstructor && this.selectedChat) {
        this.loadMessages(this.selectedChat, true);
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadInstructors(): void {
    this.isLoadingInstructors = true;
    this.error = '';
    this.adminAgent.listInstructors().subscribe({
      next: (items) => {
        this.instructors = items;
        this.isLoadingInstructors = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.isLoadingInstructors = false;
      },
    });
  }

  selectInstructor(instructor: InstructorConversationSummary): void {
    this.selectedInstructor = instructor;
    this.selectedChat = null;
    this.messages = [];
    this.chatsSource = null;
    this.messagesPage = 1;
    this.hasOlderMessages = false;
    this.loadChats(instructor.id);
  }

  loadChats(instructorId: string): void {
    this.isLoadingChats = true;
    this.error = '';
    this.adminAgent.listChats(instructorId).subscribe({
      next: (items) => {
        this.chats = items;
        this.chatsSource = items[0]?.source ?? null;
        this.isLoadingChats = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.chats = [];
        this.isLoadingChats = false;
      },
    });
  }

  selectChat(chat: ChatSummary): void {
    this.selectedChat = chat;
    this.messagesPage = 1;
    this.hasOlderMessages = false;
    this.stickToBottom = true;
    this.loadMessages(chat);
  }

  loadMessages(chat: ChatSummary, silent = false): void {
    if (!this.selectedInstructor) return;
    if (!silent) this.isLoadingMessages = true;
    this.error = '';

    this.adminAgent
      .listMessages(
        this.selectedInstructor.id,
        chat.remoteJid,
        1,
        AdminConversationsComponent.MESSAGES_PAGE_SIZE,
      )
      .subscribe({
        next: (res) => {
          const trimmed = res.messages.slice(-AdminConversationsComponent.MAX_VISIBLE_MESSAGES);
          this.messages = trimmed;
          this.messagesPage = 1;
          this.hasOlderMessages =
            (res.pages != null && res.pages > 1) ||
            res.messages.length >= AdminConversationsComponent.MESSAGES_PAGE_SIZE;
          if (!silent) this.isLoadingMessages = false;
          if (this.stickToBottom) {
            setTimeout(() => this.scrollToBottom(), 50);
          }
        },
        error: (err: Error) => {
          if (!silent) this.error = err.message;
          if (!silent) this.messages = [];
          if (!silent) this.isLoadingMessages = false;
        },
      });
  }

  loadOlderMessages(): void {
    if (!this.selectedInstructor || !this.selectedChat || this.isLoadingOlderMessages) return;

    const viewport = this.messagesViewport?.nativeElement;
    const prevHeight = viewport?.scrollHeight ?? 0;

    this.isLoadingOlderMessages = true;
    this.messagesPage += 1;

    this.adminAgent
      .listMessages(
        this.selectedInstructor.id,
        this.selectedChat.remoteJid,
        this.messagesPage,
        AdminConversationsComponent.MESSAGES_PAGE_SIZE,
      )
      .subscribe({
        next: (res) => {
          const merged = [...res.messages, ...this.messages];
          const unique = new Map(merged.map((m) => [m.id, m]));
          const sorted = [...unique.values()].sort(
            (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
          );
          this.messages = sorted.slice(-AdminConversationsComponent.MAX_VISIBLE_MESSAGES);
          this.hasOlderMessages =
            (res.currentPage != null &&
              res.pages != null &&
              res.currentPage < res.pages &&
              sorted.length >= AdminConversationsComponent.MAX_VISIBLE_MESSAGES) ||
            (res.messages.length >= AdminConversationsComponent.MESSAGES_PAGE_SIZE &&
              this.messagesPage < (res.pages ?? this.messagesPage + 1));
          this.isLoadingOlderMessages = false;
          this.stickToBottom = false;

          setTimeout(() => {
            if (viewport) {
              viewport.scrollTop = viewport.scrollHeight - prevHeight;
            }
          }, 30);
        },
        error: () => {
          this.messagesPage -= 1;
          this.isLoadingOlderMessages = false;
        },
      });
  }

  onMessagesScroll(): void {
    const viewport = this.messagesViewport?.nativeElement;
    if (!viewport) return;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    this.stickToBottom = distanceFromBottom < 48;
  }

  scrollMessagesToBottom(): void {
    this.stickToBottom = true;
    this.scrollToBottom();
  }

  connectionLabel(instructor: InstructorConversationSummary): string {
    if (instructor.connectionState === 'open' || instructor.evolutionStatus === 'connected') {
      return 'Conectado';
    }
    if (instructor.evolutionStatus === 'connecting') return 'Conectando';
    return 'Desconectado';
  }

  connectionClass(instructor: InstructorConversationSummary): string {
    if (instructor.connectionState === 'open' || instructor.evolutionStatus === 'connected') {
      return 'status-ok';
    }
    if (instructor.evolutionStatus === 'connecting') return 'status-pending';
    return 'status-off';
  }

  formatPhone(number?: string): string {
    if (!number) return '—';
    return number.startsWith('+') ? number : `+${number}`;
  }

  formatTime(iso?: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (sameDay) {
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  chatTitle(chat: ChatSummary): string {
    return chat.pushName || this.formatPhone(chat.phoneNumber);
  }

  private scrollToBottom(): void {
    const el = this.messagesViewport?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
