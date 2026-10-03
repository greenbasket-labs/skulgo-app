export type MessageStatus = "SENT" | "READ";
export type MessageType = "DIRECT" | "ANNOUNCEMENT";

export interface Message {
  messageId: string;
  schoolId: string;
  senderUserId: string;
  recipientUserId: string;
  subject: string;
  body: string;
  type: MessageType;
  createdAt: string;
  readAt?: string;
  status: MessageStatus;
}
