import type { ExpenseCategory } from "@/src/lib/expense-constants";
import type { ExpensePaymentMethod, ExpenseStatus } from "@/src/models/Expense";

export type ExpenseResponse = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paymentMethod: ExpensePaymentMethod;
  addedBy: { id: string; name: string } | null;
  notes: string;
  receiptReference: string;
  status: ExpenseStatus;
  createdAt?: string;
  updatedAt?: string;
};
