import { Types } from "mongoose";
import Notification, { type NotificationEntityType, type NotificationType } from "@/src/models/Notification";

export type NotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  dedupeKey: string;
  metadata?: Record<string, string | number>;
};

type NotificationPayload = { id: string; type: NotificationType; title: string; message: string; entityType: NotificationEntityType; entityId: string; read: boolean; metadata?: Record<string, string | number>; createdAt?: Date };
const clients = new Set<(payload: NotificationPayload) => void>();

export function subscribeToNotifications(listener: (payload: NotificationPayload) => void) {
  clients.add(listener);
  return () => clients.delete(listener);
}

export async function createNotification(input: NotificationInput) {
  if (!Types.ObjectId.isValid(input.entityId)) return;
  try {
    const notification = await Notification.create({ ...input, entityId: new Types.ObjectId(input.entityId) });
    const payload: NotificationPayload = { id: String(notification._id), type: notification.type, title: notification.title, message: notification.message, entityType: notification.entityType, entityId: String(notification.entityId), read: notification.read, metadata: notification.metadata, createdAt: notification.createdAt };
    clients.forEach((listener) => listener(payload));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === 11000)) console.error("[notifications] Unable to create notification", error);
  }
}