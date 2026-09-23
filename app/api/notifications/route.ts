import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import Notification from "@/src/models/Notification";

export const runtime = "nodejs";

function serialize(notification: { _id: unknown; type: string; title: string; message: string; entityType: string; entityId: unknown; read: boolean; metadata?: Record<string, string | number>; createdAt?: Date }) {
  return { id: String(notification._id), type: notification.type, title: notification.title, message: notification.message, entityType: notification.entityType, entityId: String(notification.entityId), read: notification.read, metadata: notification.metadata ?? {}, createdAt: notification.createdAt };
}

export async function GET() {
  try {
    await connectToDatabase();
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();
    const unreadCount = await Notification.countDocuments({ read: false });
    return NextResponse.json({ notifications: notifications.map(serialize), unreadCount });
  } catch {
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}