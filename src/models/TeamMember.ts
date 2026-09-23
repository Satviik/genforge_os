import { Document, Model, Schema, model, models } from "mongoose";

export type TeamMemberRole = "admin" | "marketing" | "sales" | "operations";
export type TeamMemberStatus = "active" | "inactive";

export interface ITeamMember {
  name: string;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  phone?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TeamMemberDocument = ITeamMember & Document;
export type TeamMemberModel = Model<ITeamMember>;

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["admin", "marketing", "sales", "operations"],
      required: true,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

export const TeamMember: TeamMemberModel =
  models.TeamMember || model<ITeamMember>("TeamMember", teamMemberSchema);

export default TeamMember;
