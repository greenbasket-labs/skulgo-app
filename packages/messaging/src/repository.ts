import type { Message } from "./model";

export interface MessagingRepository {
  save(message: Message): Promise<void>;
  get(messageId: string): Promise<Message | undefined>;
  listInbox(schoolId: string, recipientUserId: string): Promise<Message[]>;
  listSent(schoolId: string, senderUserId: string): Promise<Message[]>;
}
