import type { Message } from "./model";
import type { MessagingRepository } from "./repository";

export interface MessagingPermission {
  canSend: boolean;
  canViewInbox: boolean;
  canViewSent: boolean;
  canAnnounce: boolean;
}

export interface SendMessageInput {
  messageId: string;
  schoolId: string;
  senderUserId: string;
  recipientUserId: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface SendAnnouncementInput {
  messageIdPrefix: string;
  schoolId: string;
  senderUserId: string;
  recipientUserIds: string[];
  subject: string;
  body: string;
  createdAt: string;
}

export class MessagingService {
  constructor(private readonly repository: MessagingRepository) {}

  async send(input: SendMessageInput, permission: MessagingPermission): Promise<Message> {
    if (!permission.canSend) throw new Error("Messaging send not permitted");
    this.validateText(input.subject, "Message subject");
    this.validateText(input.body, "Message body");
    if (!input.recipientUserId) throw new Error("Message recipient is required");

    const message: Message = {
      messageId: input.messageId,
      schoolId: input.schoolId,
      senderUserId: input.senderUserId,
      recipientUserId: input.recipientUserId,
      subject: input.subject,
      body: input.body,
      type: "DIRECT",
      createdAt: input.createdAt,
      status: "SENT",
    };

    await this.repository.save(message);
    return message;
  }

  async sendAnnouncement(input: SendAnnouncementInput, permission: MessagingPermission): Promise<Message[]> {
    if (!permission.canAnnounce) throw new Error("Announcement sending not permitted");
    this.validateText(input.subject, "Announcement subject");
    this.validateText(input.body, "Announcement body");

    const recipients = [...new Set(input.recipientUserIds)].filter(Boolean);
    if (recipients.length === 0) throw new Error("Announcement recipients are required");

    const messages: Message[] = recipients.map((recipientUserId, index) => ({
      messageId: `${input.messageIdPrefix}-${index + 1}`,
      schoolId: input.schoolId,
      senderUserId: input.senderUserId,
      recipientUserId,
      subject: input.subject,
      body: input.body,
      type: "ANNOUNCEMENT" as const,
      createdAt: input.createdAt,
      status: "SENT" as const,
    }));

    for (const message of messages) await this.repository.save(message);
    return messages;
  }

  async getInbox(schoolId: string, userId: string, permission: MessagingPermission): Promise<Message[]> {
    if (!permission.canViewInbox) throw new Error("Messaging inbox viewing not permitted");
    return this.repository.listInbox(schoolId, userId);
  }

  async getSent(schoolId: string, userId: string, permission: MessagingPermission): Promise<Message[]> {
    if (!permission.canViewSent) throw new Error("Messaging sent viewing not permitted");
    return this.repository.listSent(schoolId, userId);
  }

  async markRead(messageId: string, schoolId: string, userId: string, readAt: string, permission: MessagingPermission): Promise<Message> {
    if (!permission.canViewInbox) throw new Error("Messaging inbox viewing not permitted");

    const message = await this.repository.get(messageId);
    if (!message || message.schoolId !== schoolId || message.recipientUserId !== userId) {
      throw new Error("Message not found");
    }

    const updated: Message = { ...message, status: "READ", readAt };
    await this.repository.save(updated);
    return updated;
  }

  private validateText(value: string, label: string): void {
    if (!value.trim()) throw new Error(label + " is required");
  }
}
