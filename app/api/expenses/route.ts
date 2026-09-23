import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { expenseSchema, expensePaymentMethods } from "@/src/lib/validations/expense";
import Expense, { expenseCategories } from "@/src/models/Expense";
import TeamMember from "@/src/models/TeamMember";

export const runtime = "nodejs";

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
type ExpenseRecord = { _id: unknown; category: string; description: string; amount: number; date: Date; paymentMethod: string; addedBy?: unknown; notes?: string; receiptReference?: string; status: string; createdAt?: Date; updatedAt?: Date };
function serializeExpense(expense: ExpenseRecord) {
  const addedBy = expense.addedBy && typeof expense.addedBy === "object" && "name" in expense.addedBy && "_id" in expense.addedBy ? expense.addedBy as { _id: unknown; name: string } : null;
  return { id: String(expense._id), category: expense.category, description: expense.description, amount: expense.amount, date: expense.date, paymentMethod: expense.paymentMethod, addedBy: addedBy ? { id: String(addedBy._id), name: addedBy.name } : null, notes: expense.notes ?? "", receiptReference: expense.receiptReference ?? "", status: expense.status, createdAt: expense.createdAt, updatedAt: expense.updatedAt };
}
function buildDateFilter(from: string | null, to: string | null) { return from || to ? { ...(from ? { $gte: new Date(`${from}T00:00:00`) } : {}), ...(to ? { $lte: new Date(`${to}T23:59:59.999`) } : {}) } : undefined; }

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim(); const category = searchParams.get("category"); const paymentMethod = searchParams.get("paymentMethod"); const from = searchParams.get("from"); const to = searchParams.get("to"); const status = searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (search) { const expression = new RegExp(escapeRegex(search), "i"); filter.$or = [{ description: expression }, { notes: expression }, { receiptReference: expression }]; }
    if (category && expenseCategories.includes(category as (typeof expenseCategories)[number])) filter.category = category;
    if (paymentMethod && expensePaymentMethods.includes(paymentMethod as (typeof expensePaymentMethods)[number])) filter.paymentMethod = paymentMethod;
    const dateFilter = buildDateFilter(from, to); if (dateFilter) filter.date = dateFilter;
    filter.status = status === "voided" ? "voided" : { $ne: "voided" };
    const expenses = await Expense.find(filter).populate("addedBy", "name").sort({ date: -1, createdAt: -1 }).lean();
    const serialized = expenses.map(serializeExpense);
    const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const activeExpenses = serialized.filter((expense) => expense.status !== "voided");
    const materialCategories = new Set(["Filament / Materials", "Packaging"]);
    const operatingCategories = new Set(["Electricity", "Machine Maintenance", "Equipment", "Marketing", "Software", "Marketplace Fees", "Shipping", "Other"]);
    return NextResponse.json({ expenses: serialized, summary: { totalExpenses: activeExpenses.reduce((sum, expense) => sum + expense.amount, 0), thisMonth: activeExpenses.filter((expense) => new Date(expense.date) >= monthStart).reduce((sum, expense) => sum + expense.amount, 0), materialExpenses: activeExpenses.filter((expense) => materialCategories.has(expense.category)).reduce((sum, expense) => sum + expense.amount, 0), operatingExpenses: activeExpenses.filter((expense) => operatingCategories.has(expense.category)).reduce((sum, expense) => sum + expense.amount, 0) } });
  } catch { return NextResponse.json({ error: "Unable to load expenses." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const parsed = expenseSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const { addedBy, ...input } = parsed.data;
    if (addedBy) { const member = await TeamMember.findOne({ _id: addedBy, active: true }); if (!member) return NextResponse.json({ error: "Selected team member was not found." }, { status: 400 }); }
    const expense = await Expense.create({ ...input, addedBy: addedBy || undefined });
    const populated = await Expense.findById(expense._id).populate("addedBy", "name").lean();
    return NextResponse.json({ expense: serializeExpense(populated!) }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to create expense." }, { status: 500 }); }
}
