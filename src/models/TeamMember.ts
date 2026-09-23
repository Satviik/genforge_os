import { Document, Model, Schema, model, models } from "mongoose";

export type TeamMemberRole = "admin" | "marketing" | "sales" | "operations";

export interface ITeamMember {
  name: string;
  email: string;
  role: TeamMemberRole;
  channelFocus: string;
  active: boolean;
  phone?: string;
  notes?: string;
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
    channelFocus: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    phone: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const TeamMember: TeamMemberModel =
  models.TeamMember || model<ITeamMember>("TeamMember", teamMemberSchema);

export default TeamMember;
