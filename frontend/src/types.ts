export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface Email {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string;
  messageId?: string;
  error?: string;
  createdAt: string;
}
