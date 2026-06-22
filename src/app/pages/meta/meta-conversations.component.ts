import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetaService } from '../../core/services/meta.service';
import { MetaConversation, MetaChatMessage } from '../../models/meta.model';

@Component({
  selector: 'app-meta-conversations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meta-conversations.component.html',
  styleUrls: ['./meta-conversations.component.css', './meta-shared.css'],
})
export class MetaConversationsComponent implements OnInit {
  conversations: MetaConversation[] = [];
  selectedId: string | null = null;
  messages: MetaChatMessage[] = [];
  isLoading = true;

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.getConversations().subscribe({
      next: (c) => {
        this.conversations = c;
        this.isLoading = false;
        if (c.length) this.selectConversation(c[0].id);
      },
      error: () => { this.isLoading = false; },
    });
  }

  selectConversation(id: string): void {
    this.selectedId = id;
    this.metaService.getConversationMessages(id).subscribe({
      next: (res) => (this.messages = res.messages),
    });
  }

  get selectedConversation(): MetaConversation | undefined {
    return this.conversations.find(c => c.id === this.selectedId);
  }
}
