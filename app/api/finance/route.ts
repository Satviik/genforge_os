import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateOrderTotals } from "@/src/lib/order-calculations";
import Expense from "@/src/models/Expense";
import Order from "@/src/models/Order";
import Product from "@/src/models/Product";

export const runtime = "nodejs";

const channelLabels: Record<string, string> = { website: "Website", instagram: "Instagram", direct: "Direct / Calls", whatsapp: "WhatsApp", marketplace: "Marketplace", other: "Other" };
const expenseColors = ["#FF6A00", "#E68A3A", "#B45F28", "#7E4522", "#4F3423", "#9B9188", "#C7B8AA", "#6E5A4E", "#D96C33", "#3A2A22"];

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function displayDate(key: string) { return new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
function getDateRange(searchParams: URLSearchParams) {
  const now = new Date(); const preset = searchParams.get("preset") ?? "30days";
  if (preset === "today") { const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); return { start, end: now }; }
  if (preset === "7days") return { start: new Date(now.getTime() - 6 * 86400000), end: now };
  if (preset === "thisMonth") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  if (preset === "lastMonth") return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999) };
  if (preset === "thisYear") return { start: new Date(now.getFullYear(), 0, 1), end: now };
  if (preset === "custom") return { start: new Date(`${searchParams.get("from")}T00:00:00`), end: new Date(`${searchParams.get("to")}T23:59:59.999`) };
  return { start: new Date(now.getTime() - 29 * 86400000), end: now };
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { start, end } = getDateRange(new URL(request.url).searchParams);
    const [orders, expenses, products] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end } }).populate("teamMember", "name").lean(),
      Expense.find({ date: { $gte: start, $lte: end }, status: { $ne: "voided" } }).lean(),
      Product.find().lean(),
    ]);
    const productCosts = new Map(products.map((product) => [String(product._id), product.materialCost + product.productionCost + product.packagingCost + product.otherCost]));
    const completedOrders = orders.filter((order) => order.status !== "cancelled" && order.paymentStatus !== "refunded" && (order.status === "delivered" || order.paymentStatus === "paid"));
    const revenueOrders = completedOrders.map((order) => ({ ...order, ...calculateOrderTotals(order) }));
    const revenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    const productCost = revenueOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (productCosts.get(String(item.product)) ?? 0) * item.quantity, 0), 0);
    const shippingCosts = revenueOrders.reduce((sum, order) => sum + order.shipping, 0);
    const operatingExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCosts = productCost + operatingExpenses + shippingCosts;
    const grossProfit = revenue - productCost;
    const netProfit = revenue - totalCosts;

    const timeline = new Map<string, { revenue: number; expenses: number; profit: number }>();
    const ensureDay = (key: string) => { if (!timeline.has(key)) timeline.set(key, { revenue: 0, expenses: 0, profit: 0 }); return timeline.get(key)!; };
    revenueOrders.forEach((order) => { const day = ensureDay(dateKey(new Date(order.createdAt ?? start))); const cost = order.items.reduce((sum, item) => sum + (productCosts.get(String(item.product)) ?? 0) * item.quantity, 0) + order.shipping; day.revenue += order.total; day.profit += order.total - cost; });
    expenses.forEach((expense) => { const day = ensureDay(dateKey(new Date(expense.date))); day.expenses += expense.amount; day.profit -= expense.amount; });
    const revenueOverTime = [...timeline.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, label: displayDate(date), revenue: values.revenue, expenses: values.expenses }));
    const profitOverTime = [...timeline.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, label: displayDate(date), profit: values.profit }));

    const channelTotals = new Map<string, number>(); revenueOrders.forEach((order) => channelTotals.set(order.channel, (channelTotals.get(order.channel) ?? 0) + order.total));
    const revenueByChannel = Object.entries(channelLabels).map(([channel, label]) => ({ channel, label, revenue: channelTotals.get(channel) ?? 0 })).filter((item) => item.revenue > 0 || revenueOrders.length === 0);
    const expenseTotals = new Map<string, number>(); expenses.forEach((expense) => expenseTotals.set(expense.category, (expenseTotals.get(expense.category) ?? 0) + expense.amount));
    const expensesByCategory = [...expenseTotals.entries()].sort(([, a], [, b]) => b - a).map(([category, amount], index) => ({ category, amount, color: expenseColors[index % expenseColors.length] }));
    const productTotals = new Map<string, { name: string; revenue: number; cost: number; units: number }>();
    revenueOrders.forEach((order) => order.items.forEach((item) => { const key = String(item.product); const current = productTotals.get(key) ?? { name: item.productName, revenue: 0, cost: 0, units: 0 }; current.revenue += item.unitPrice * item.quantity; current.cost += (productCosts.get(key) ?? 0) * item.quantity; current.units += item.quantity; productTotals.set(key, current); }));
    const productProfitability = [...productTotals.entries()].sort(([, a], [, b]) => (b.revenue - b.cost) - (a.revenue - a.cost)).slice(0, 8).map(([id, product]) => ({ id, name: product.name, units: product.units, revenue: product.revenue, cost: product.cost, profit: product.revenue - product.cost }));
    const teamTotals = new Map<string, { name: string; revenue: number }>(); revenueOrders.forEach((order) => { const member = order.teamMember && typeof order.teamMember === "object" && "name" in order.teamMember ? order.teamMember as { _id: unknown; name: string } : { _id: "", name: "Unassigned" }; const key = String(member._id); const current = teamTotals.get(key) ?? { name: member.name, revenue: 0 }; current.revenue += order.total; teamTotals.set(key, current); });
    const teamRevenue = [...teamTotals.entries()].sort(([, a], [, b]) => b.revenue - a.revenue).map(([id, member]) => ({ id, ...member }));
    const recentActivity = [...revenueOrders.map((order) => ({ id: String(order._id), date: order.createdAt, type: "revenue" as const, label: order.orderNumber, detail: `${order.channel} order`, amount: order.total })), ...expenses.map((expense) => ({ id: String(expense._id), date: expense.date, type: "expense" as const, label: expense.description, detail: expense.category, amount: expense.amount }))].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).slice(0, 10);

    return NextResponse.json({ range: { start, end }, overview: { revenue, productCosts: productCost, operatingExpenses, shippingCosts, totalCosts, grossProfit, netProfit, profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0 }, revenueOverTime, revenueByChannel, expensesByCategory, profitOverTime, productProfitability, teamRevenue, recentActivity });
  } catch { return NextResponse.json({ error: "Unable to load financial data." }, { status: 500 }); }
}
