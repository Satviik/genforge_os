import { z } from "zod";

export const teamMemberRoles = ["admin", "marketing", "sales", "operations"] as const;

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  phone: optionalText(30),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  role: z.enum(teamMemberRoles),
  channelFocus: z.string().trim().min(2, "Channel focus is required.").max(100),
  notes: optionalText(1000),
  active: z.boolean().default(true),
});

export const teamMemberUpdateSchema = teamMemberSchema.partial();

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type TeamMemberUpdate = z.infer<typeof teamMemberUpdateSchema>;
