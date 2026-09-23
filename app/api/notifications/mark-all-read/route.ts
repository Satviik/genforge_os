import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import Notification from "@/src/models/Notification";

export const runtime = "nodejs";

export async function POST() {
  try {
    await connectToDatabase();
    await Notification.updateMany({ read: false }, { read: true });
    return NextResponse.json({ unreadCount: 0 });
  } catch {
    return NextResponse.json({ error: "Unable to mark notifications as read." }, { status: 500 });
  }
}