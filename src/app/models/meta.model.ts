export interface MetaContact {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface MetaTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MetaApiConfig {
  id?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  appSecret?: string;
  verifyToken?: string;
  graphApiVersion?: string;
  updatedAt?: string;
}

export interface MetaDashboardStats {
  messagesSentToday: number;
  messagesReceived: number;
  activeConversations: number;
  availableTemplates: number;
  webhookStatus: string;
  metaConnectionStatus: string;
  connectionError?: string;
  phoneNumber?: string;
}

export interface MetaConversation {
  id: string;
  contactName: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface MetaChatMessage {
  id: string;
  direction: 'sent' | 'received';
  body: string;
  timestamp: string;
}

export interface MetaWebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface MetaLogEntry {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  timestamp: string;
}
