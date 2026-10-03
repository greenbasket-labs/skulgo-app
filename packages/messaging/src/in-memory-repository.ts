import type { Message } from "./model";
import type { MessagingRepository } from "./repository";

export class MessagingInMemoryRepository implements MessagingRepository {
  private readonly messages = new Map<string, Message>();

  constructor(initialMessages: Message[] = []) {
    for (const message of initialMessages) this.messages.set(message.messageId, message);
  }

  async save(message: Message): Promise<void> {
    this.messages.set(message.messageId, message);
  }

  async get(messageId: string): Promise<Message | undefined> {
    return this.messages.get(messageId);
  }

  async listInbox(schoolId: string, recipientUserId: string): Promise<Message[]> {
    return [...this.messages.values()]
      .filter((message) => message.schoolId === schoolId && message.recipientUserId === recipientUserId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listSent(schoolId: string, senderUserId: string): Promise<Message[]> {
    return [...this.messages.values()]
      .filter((message) => message.schoolId === schoolId && message.senderUserId === senderUserId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}
