import { NextResponse } from "next/server";
import { logMongoError, pingDatabase } from "@/src/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    await pingDatabase();
    return NextResponse.json({ database: "connected" });
  } catch (error) {
    logMongoError(error);
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 },
    );
  }
}
