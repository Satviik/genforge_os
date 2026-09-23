export const expenseCategories = [
  "Filament / Materials",
  "Packaging",
  "Shipping",
  "Electricity",
  "Machine Maintenance",
  "Equipment",
  "Marketing",
  "Software",
  "Marketplace Fees",
  "Other",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];
