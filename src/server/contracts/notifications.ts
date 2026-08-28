export interface NotificationMessage {
  subject: string;
  body: string;
  recipient: string;
}

export interface NotificationSender {
  send(message: NotificationMessage): Promise<void>;
}
