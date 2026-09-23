import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { teamMemberRoles, teamMemberSchema } from "@/src/lib/validations/team-member";
import TeamMember from "@/src/models/TeamMember";
import { createNotification } from "@/src/lib/notifications";

export const runtime = "nodejs";

function serializeTeamMember(member: {
  _id: unknown;
  name: string;
  phone?: string;
  email: string;
  role: string;
  channelFocus: string;
  notes?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(member._id),
    name: member.name,
    phone: member.phone ?? "",
    email: member.email,
    role: member.role,
    channelFocus: member.channelFocus,
    notes: member.notes ?? "",
    active: member.active,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role");
    const active = searchParams.get("active");
    const filter: Record<string, unknown> = {};

    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { name: expression },
        { email: expression },
        { channelFocus: expression },
      ];
    }

    if (role && teamMemberRoles.includes(role as (typeof teamMemberRoles)[number])) {
      filter.role = role;
    }

    if (active === "true" || active === "false") {
      filter.active = active === "true";
    }

    const members = await TeamMember.find(filter).sort({ active: -1, name: 1 }).lean();

    return NextResponse.json({
      members: members.map(serializeTeamMember),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load team members." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = teamMemberSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const member = await TeamMember.create(parsed.data);
    await createNotification({ type: "team_member_created", title: "Team member added", message: `${member.name} joined the GenForge team.`, entityType: "team", entityId: String(member._id), dedupeKey: `team_member_created:${member._id}` });

    return NextResponse.json(
      { member: serializeTeamMember(member.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "A team member with this email already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create team member." },
      { status: 500 },
    );
  }
}
