import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateOrderTotals } from "@/src/lib/order-calculations";
import { orderSchema, orderChannels, orderStatuses, paymentStatuses } from "@/src/lib/validations/order";
import Customer from "@/src/models/Customer";
import Order from "@/src/models/Order";
import Product from "@/src/models/Product";
import TeamMember from "@/src/models/TeamMember";

export const runtime = "nodejs";

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function formatOrderNumber() { return `GF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString(36).slice(-5).toUpperCase()}`; }

type OrderReference = { _id: unknown; name: string; phone?: string };
type OrderItemRecord = { product?: { _id: unknown } | unknown; productName: string; sku: string; quantity: number; unitPrice: number };
type OrderRecord = { _id: unknown; orderNumber: string; customer: OrderReference | unknown; teamMember: OrderReference | unknown; items: OrderItemRecord[]; channel: string; discount: number; shipping: number; paymentStatus: string; paymentMethod?: string; paidAmount: number; status: string; notes?: string; timeline?: { status: string; at: Date }[]; createdAt?: Date; updatedAt?: Date };

function serializeOrder(order: OrderRecord) {
  const customer = order.customer && typeof order.customer === "object" && "name" in order.customer ? order.customer as OrderReference : { _id: order.customer, name: "Unknown customer", phone: "" };
  const teamMember = order.teamMember && typeof order.teamMember === "object" && "name" in order.teamMember ? order.teamMember as OrderReference : { _id: order.teamMember, name: "Unknown team member" };
  const items = order.items.map((item) => ({ productId: String(item.product && typeof item.product === "object" && "_id" in item.product ? item.product._id : item.product), name: item.productName, sku: item.sku, quantity: item.quantity, unitPrice: item.unitPrice }));
  const { subtotal, total } = calculateOrderTotals(order);
  return { id: String(order._id), orderNumber: order.orderNumber, customer: { id: String(customer._id), name: customer.name, phone: customer.phone ?? "" }, teamMember: { id: String(teamMember._id), name: teamMember.name }, items, channel: order.channel, subtotal, discount: order.discount, shipping: order.shipping, total, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, paidAmount: order.paidAmount, status: order.status, notes: order.notes ?? "", timeline: (order.timeline ?? []).map((event) => ({ status: event.status, at: event.at })), createdAt: order.createdAt, updatedAt: order.updatedAt };
}

async function prepareItems(items: { product: string; quantity: number }[]) {
  const ids = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: ids }, active: true }).lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));
  if (byId.size !== new Set(ids).size) throw new Error("One or more selected products are unavailable.");
  return items.map((item) => { const product = byId.get(item.product)!; return { product: product._id, productName: product.name, sku: product.sku, quantity: item.quantity, unitPrice: product.sellingPrice }; });
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const channel = searchParams.get("channel");
    const paymentStatus = searchParams.get("paymentStatus");
    const status = searchParams.get("status");
    const teamMember = searchParams.get("teamMember");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const filter: Record<string, unknown> = {};
    if (channel && orderChannels.includes(channel as (typeof orderChannels)[number])) filter.channel = channel;
    if (paymentStatus && paymentStatuses.includes(paymentStatus as (typeof paymentStatuses)[number])) filter.paymentStatus = paymentStatus;
    if (status && orderStatuses.includes(status as (typeof orderStatuses)[number])) filter.status = status;
    if (teamMember) filter.teamMember = teamMember;
    if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(`${from}T00:00:00`) } : {}), ...(to ? { $lte: new Date(`${to}T23:59:59.999`) } : {}) };
    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      const [customers, matchingOrders] = await Promise.all([Customer.find({ $or: [{ name: expression }, { phone: expression }] }).select("_id").lean(), Order.find({ orderNumber: expression }).select("_id").lean()]);
      filter.$or = [{ customer: { $in: customers.map((item) => item._id) } }, { _id: { $in: matchingOrders.map((item) => item._id) } }];
    }
    const orders = await Order.find(filter).populate("customer", "name phone").populate("teamMember", "name").sort({ createdAt: -1 }).lean();
    const serialized = orders.map(serializeOrder);
    return NextResponse.json({ orders: serialized, summary: { totalOrders: serialized.length, revenue: serialized.reduce((sum, order) => sum + order.total, 0), paidOrders: serialized.filter((order) => order.paymentStatus === "paid").length, pendingPayments: serialized.filter((order) => order.paymentStatus === "pending" || order.paymentStatus === "partial").length } });
  } catch { return NextResponse.json({ error: "Unable to load orders." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const parsed = orderSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const [customer, teamMember] = await Promise.all([Customer.findOne({ _id: parsed.data.customer, status: "active" }), TeamMember.findOne({ _id: parsed.data.teamMember, active: true })]);
    if (!customer) return NextResponse.json({ error: "Selected customer was not found." }, { status: 400 });
    if (!teamMember) return NextResponse.json({ error: "Selected team member was not found." }, { status: 400 });
    const items = await prepareItems(parsed.data.items);
    const order = await Order.create({ ...parsed.data, items, orderNumber: formatOrderNumber(), timeline: [{ status: parsed.data.status, at: new Date() }] });
    const populated = await Order.findById(order._id).populate("customer", "name phone").populate("teamMember", "name").lean();
    if (!populated) throw new Error("Created order could not be loaded.");
    return NextResponse.json({ order: serializeOrder(populated) }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create order." }, { status: 500 }); }
}
