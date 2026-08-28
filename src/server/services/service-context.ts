import type { PrismaClient } from "@prisma/client";
import type { NotificationSender } from "../contracts/notifications";
import type { RealtimePublisher } from "../contracts/realtime";
import type { FileStorage } from "../contracts/storage";

export interface ServiceContext {
  db: PrismaClient;
  notifications: NotificationSender;
  realtime: RealtimePublisher;
  storage: FileStorage;
}
