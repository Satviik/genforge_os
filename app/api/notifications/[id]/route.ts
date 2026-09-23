import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import Notification from "@/src/models/Notification";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid notification id." }, { status: 400 });
  try {
    const body = await request.json();
    if (typeof body.read !== "boolean") return NextResponse.json({ error: "read must be a boolean." }, { status: 400 });
    await connectToDatabase();
    const notification = await Notification.findByIdAndUpdate(id, { read: body.read }, { new: true }).lean();
    if (!notification) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ notification: { id: String(notification._id), read: notification.read } });
  } catch {
    return NextResponse.json({ error: "Unable to update notification." }, { status: 500 });
  }
}