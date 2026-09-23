import { Document, Model, Schema, Types, model, models } from "mongoose";
import { expenseCategories, type ExpenseCategory } from "@/src/lib/expense-constants";

export { expenseCategories };
export type ExpenseStatus = "pending" | "paid" | "voided";
export type ExpensePaymentMethod = "cash" | "upi" | "bank_transfer" | "card" | "other";

export interface IExpense {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  status: ExpenseStatus;
  paymentMethod: ExpensePaymentMethod;
  addedBy?: Types.ObjectId;
  notes?: string;
  receiptReference?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ExpenseDocument = IExpense & Document;
export type ExpenseModel = Model<IExpense>;

const expenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: expenseCategories, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["pending", "paid", "voided"], default: "paid" },
    paymentMethod: { type: String, enum: ["cash", "upi", "bank_transfer", "card", "other"], required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "TeamMember" },
    notes: { type: String, trim: true },
    receiptReference: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Expense: ExpenseModel =
  models.Expense || model<IExpense>("Expense", expenseSchema);

export default Expense;
