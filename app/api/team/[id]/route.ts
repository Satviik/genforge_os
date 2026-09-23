import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import { teamMemberUpdateSchema, teamMemberSchema } from "@/src/lib/validations/team-member";
import TeamMember from "@/src/models/TeamMember";
import { createNotification } from "@/src/lib/notifications";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function getId(context: RouteContext) {
  const { id } = await context.params;
  return Types.ObjectId.isValid(id) ? id : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const id = await getId(context);

  if (!id) {
    return NextResponse.json({ error: "Invalid team member id." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const member = await TeamMember.findById(id).lean();

    if (!member) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    return NextResponse.json({ member: serializeTeamMember(member) });
  } catch {
    return NextResponse.json(
      { error: "Unable to load team member." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const id = await getId(context);

  if (!id) {
    return NextResponse.json({ error: "Invalid team member id." }, { status: 400 });
  }

  try {
    const parsed = teamMemberSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const member = await TeamMember.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!member) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    if (parsed.data.active === false) await createNotification({ type: "team_member_deactivated", title: "Team member deactivated", message: `${member.name} was deactivated.`, entityType: "team", entityId: String(member._id), dedupeKey: `team_member_deactivated:${member._id}` });

    return NextResponse.json({ member: serializeTeamMember(member) });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "A team member with this email already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to update team member." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await getId(context);

  if (!id) {
    return NextResponse.json({ error: "Invalid team member id." }, { status: 400 });
  }

  try {
    const parsed = teamMemberUpdateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const member = await TeamMember.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!member) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    if (parsed.data.active === false) await createNotification({ type: "team_member_deactivated", title: "Team member deactivated", message: `${member.name} was deactivated.`, entityType: "team", entityId: String(member._id), dedupeKey: `team_member_deactivated:${member._id}` });

    return NextResponse.json({ member: serializeTeamMember(member) });
  } catch {
    return NextResponse.json(
      { error: "Unable to update team member." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = await getId(context);

  if (!id) {
    return NextResponse.json({ error: "Invalid team member id." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const member = await TeamMember.findByIdAndUpdate(
      id,
      { active: false },
      { new: true, runValidators: true },
    ).lean();

    if (!member) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    await createNotification({ type: "team_member_deactivated", title: "Team member deactivated", message: `${member.name} was deactivated.`, entityType: "team", entityId: String(member._id), dedupeKey: `team_member_deactivated:${member._id}` });

    return NextResponse.json({ member: serializeTeamMember(member) });
  } catch {
    return NextResponse.json(
      { error: "Unable to deactivate team member." },
      { status: 500 },
    );
  }
}
