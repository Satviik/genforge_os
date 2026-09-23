import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import TeamMember from "@/src/models/TeamMember";

export const runtime = "nodejs";

export async function GET() { try { await connectToDatabase(); const members = await TeamMember.find({ active: true }).sort({ name: 1 }).select("name").lean(); return NextResponse.json({ teamMembers: members.map((member) => ({ id: String(member._id), name: member.name })) }); } catch { return NextResponse.json({ error: "Unable to load inventory options." }, { status: 500 }); } }
