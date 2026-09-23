import { z } from "zod";
import { expenseCategories } from "@/src/lib/expense-constants";

export const expensePaymentMethods = ["cash", "upi", "bank_transfer", "card", "other"] as const;

export const expenseSchema = z.object({
  category: z.enum(expenseCategories),
  description: z.string().trim().min(2, "Description must be at least 2 characters.").max(200),
  amount: z.number().finite().positive("Amount must be greater than zero."),
  date: z.coerce.date(),
  paymentMethod: z.enum(expensePaymentMethods),
  addedBy: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  receiptReference: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["pending", "paid", "voided"]).default("paid"),
});

export const expenseUpdateSchema = expenseSchema.partial();
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseUpdate = z.infer<typeof expenseUpdateSchema>;
