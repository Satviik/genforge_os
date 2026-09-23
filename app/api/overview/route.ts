import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateOrderTotals } from "@/src/lib/order-calculations";
import { dateRangeFilter, getReportingRange } from "@/src/lib/reporting-period";
import Expense from "@/src/models/Expense";
import Order from "@/src/models/Order";
import Product from "@/src/models/Product";
import ProductionJob from "@/src/models/ProductionJob";
import TeamMember from "@/src/models/TeamMember";

export const runtime = "nodejs";

const channels = [{ key: "website", label: "Website" }, { key: "instagram", label: "Instagram" }, { key: "direct", label: "Direct" }, { key: "whatsapp", label: "WhatsApp" }, { key: "marketplace", label: "Marketplace" }, { key: "other", label: "Other" }];
const costColors = ["#FF6A00", "#C24E00", "#8A3A12", "#3A2A22", "#9B9188", "#6E5A4E"];

function money(value: number) { return `₹${Math.round(value).toLocaleString("en-IN")}`; }
function dateLabel(value: Date) { return value.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }); }
function relativeDate(value: Date) { const days = Math.floor((Date.now() - value.getTime()) / 86400000); return days <= 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} ago`; }

export async function GET(request: Request) {
  try {
    const range = getReportingRange(new URL(request.url).searchParams);
    await connectToDatabase();
    const orderFilter = range.kind === "all" ? { status: { $ne: "cancelled" as const } } : { createdAt: dateRangeFilter(range), status: { $ne: "cancelled" as const } };
    const expenseFilter = range.kind === "all" ? { status: { $ne: "voided" as const } } : { date: dateRangeFilter(range), status: { $ne: "voided" as const } };
    const productionFilter = range.kind === "all" ? {} : { createdAt: dateRangeFilter(range) };
    const [orders, expenses, products, jobs, teamMembers, customerCount] = await Promise.all([
      Order.find(orderFilter).populate("customer", "name").populate("teamMember", "name").sort({ createdAt: -1 }).lean(),
      Expense.find(expenseFilter).sort({ date: -1 }).lean(),
      Product.find().lean(),
      ProductionJob.find(productionFilter).lean(),
      TeamMember.find({ active: true }).sort({ name: 1 }).lean(),
      Order.distinct("customer", orderFilter),
    ]);
    const productById = new Map(products.map((product) => [String(product._id), product]));
    const completedOrders = orders.filter((order) => order.status !== "cancelled" && order.paymentStatus !== "refunded" && (order.status === "delivered" || order.paymentStatus === "paid"));
    const revenueOrders = completedOrders.map((order) => ({ order, total: calculateOrderTotals(order).total }));
    const revenue = revenueOrders.reduce((sum, item) => sum + item.total, 0);
    const productCostTotals = { material: 0, production: 0, packaging: 0, other: 0 };
    const channelTotals = new Map<string, number>();
    const productTotals = new Map<string, { name: string; units: number; revenue: number }>();
    revenueOrders.forEach(({ order, total }) => {
      channelTotals.set(order.channel, (channelTotals.get(order.channel) ?? 0) + total);
      order.items.forEach((item) => {
        const product = productById.get(String(item.product));
        if (item.unitCost !== undefined) productCostTotals.other += item.unitCost * item.quantity;
        else {
          productCostTotals.material += (product?.materialCost ?? 0) * item.quantity;
          productCostTotals.production += (product?.productionCost ?? 0) * item.quantity;
          productCostTotals.packaging += (product?.packagingCost ?? 0) * item.quantity;
          productCostTotals.other += (product?.otherCost ?? 0) * item.quantity;
        }
        const current = productTotals.get(String(item.product)) ?? { name: item.productName, units: 0, revenue: 0 };
        current.units += item.quantity; current.revenue += item.unitPrice * item.quantity; productTotals.set(String(item.product), current);
      });
    });
    const shipping = revenueOrders.reduce((sum, { order }) => sum + order.shipping, 0);
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCosts = Object.values(productCostTotals).reduce((sum, value) => sum + value, 0) + shipping + expensesTotal;
    const netProfit = revenue - totalCosts;
    const itemsSold = revenueOrders.reduce((sum, { order }) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const kpi = (id: string, label: string, value: number) => ({ id, label, value: money(value), delta: 0, direction: "up" as const, sparkline: [value, value] });
    const teamRevenue = new Map<string, { revenue: number; orders: number }>();
    revenueOrders.forEach(({ order, total }) => { const id = String(order.teamMember && typeof order.teamMember === "object" ? order.teamMember._id : order.teamMember); const current = teamRevenue.get(id) ?? { revenue: 0, orders: 0 }; current.revenue += total; current.orders += 1; teamRevenue.set(id, current); });
    const expenseItems = expenses.slice(0, 4).map((expense) => ({ id: String(expense._id), category: expense.category, label: expense.description, amount: expense.amount }));
    const profitSlices = [{ id: "material", label: "Material Cost", amount: productCostTotals.material }, { id: "production", label: "Production Cost", amount: productCostTotals.production }, { id: "packaging", label: "Packaging", amount: productCostTotals.packaging }, { id: "other", label: "Other Product Cost", amount: productCostTotals.other }, { id: "shipping", label: "Shipping", amount: shipping }, { id: "operating", label: "Operating Expense", amount: expensesTotal }];
    return NextResponse.json({
      operatorName: "Satvik", operatorRole: "Founder", dateRangeLabel: range.kind === "all" ? "All time" : `${dateLabel(range.start)} - ${dateLabel(new Date(range.end.getTime() - 1))}`, greetingTagline: "Build. Print. Sell. Grow.",
      kpis: [kpi("revenue", "Total Revenue", revenue), kpi("costs", "Total Costs", totalCosts), kpi("profit", "Net Profit", netProfit), kpi("orders", "Total Orders", orders.length), kpi("items", "Items Sold", itemsSold)],
      revenueByChannel: channels.map(({ key, label }) => ({ channel: label, revenue: channelTotals.get(key) ?? 0 })),
      recentOrders: orders.slice(0, 5).map((order) => ({ id: order.orderNumber, customerName: order.customer && typeof order.customer === "object" && "name" in order.customer ? order.customer.name : "Unknown customer", amount: calculateOrderTotals(order).total, status: order.paymentStatus === "paid" ? "Paid" as const : "Pending" as const, relativeTime: relativeDate(new Date(order.createdAt ?? Date.now())) })),
      topProducts: [...productTotals.entries()].sort(([, left], [, right]) => right.revenue - left.revenue).slice(0, 5).map(([id, product]) => ({ id, name: product.name, unitsSold: product.units, revenue: product.revenue })),
      profitBreakdown: { profitPercent: revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0, slices: profitSlices.filter((slice) => slice.amount > 0 || revenue === 0).map((slice, index) => ({ ...slice, color: costColors[index % costColors.length] })), totalCosts },
      quickActions: [{ id: "person", label: "Add Person", href: "/dashboard/people" }, { id: "product", label: "Add Product", href: "/dashboard/products" }, { id: "order", label: "New Order", href: "/dashboard/orders" }, { id: "expense", label: "Add Expense", href: "/dashboard/expenses" }], mascotQuote: "Ideas take shape when you print them.",
      teamPerformance: teamMembers.map((member) => { const totals = teamRevenue.get(String(member._id)) ?? { revenue: 0, orders: 0 }; return { id: String(member._id), name: member.name, role: member.role, metricLabel: "Orders closed", metricValue: String(totals.orders), attributedRevenue: totals.revenue }; }),
      expenses: expenseItems, expenseTotal: expensesTotal,
      networkNodes: [{ id: "products", label: "Products", meta: `${products.length} SKUs` }, { id: "orders", label: "Orders", meta: `${orders.length} orders` }, { id: "production", label: "Production", meta: `${jobs.length} jobs` }, { id: "profit", label: "Profit", meta: money(netProfit), accent: "green" }, { id: "expenses", label: "Expenses", meta: money(expensesTotal) }, { id: "channels", label: "Channels", meta: `${channelTotals.size} active` }, { id: "customers", label: "Customers", meta: `${customerCount.length} people` }], networkHubValue: money(revenue),
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "Invalid reporting period." ? error.message : "Unable to load overview data.";
    return NextResponse.json({ error: message }, { status: message === "Invalid reporting period." ? 400 : 500 });
  }
}