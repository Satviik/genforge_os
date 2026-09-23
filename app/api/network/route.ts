import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateOrderTotals } from "@/src/lib/order-calculations";
import Expense from "@/src/models/Expense";
import InventoryTransaction from "@/src/models/InventoryTransaction";
import Material from "@/src/models/Material";
import Order from "@/src/models/Order";
import ProductionJob from "@/src/models/ProductionJob";
import Product from "@/src/models/Product";
import TeamMember from "@/src/models/TeamMember";
import Customer from "@/src/models/Customer";
import type { NetworkGraphEdge, NetworkGraphNode, NetworkNodeData, NetworkNodeKind } from "@/src/lib/network-types";

export const runtime = "nodejs";

const channelLabels: Record<string, string> = { website: "Website", instagram: "Instagram", direct: "Direct / Calls", whatsapp: "WhatsApp", marketplace: "Marketplace", other: "Other" };
const kindOffsets: Record<NetworkNodeKind, { x: number; y: number }> = { hub: { x: 0, y: 0 }, revenue: { x: 0, y: 420 }, profit: { x: 0, y: 640 }, team: { x: -520, y: -260 }, customer: { x: 520, y: -260 }, order: { x: 0, y: -220 }, product: { x: -320, y: 120 }, channel: { x: 320, y: 120 }, production: { x: 520, y: 380 }, expense: { x: -520, y: 380 }, material: { x: -320, y: 520 } };
const kindLabels: Record<NetworkNodeKind, string> = { hub: "GenForge", team: "Team Member", customer: "Customer", product: "Product", order: "Order", channel: "Sales Channel", expense: "Expense", production: "Production Job", material: "Material", revenue: "Revenue", profit: "Profit" };

function stringId(value: unknown) { return String(value); }
function refId(value: unknown) { return value && typeof value === "object" && "_id" in value ? stringId(value._id) : stringId(value); }
function addNode(nodes: NetworkGraphNode[], id: string, kind: NetworkNodeKind, label: string, subtitle: string, metrics: Record<string, string | number> = {}) { const offset = kindOffsets[kind]; const index = nodes.filter((node) => node.data.kind === kind).length; const column = index % 3; const row = Math.floor(index / 3); const data: NetworkNodeData = { kind, label, subtitle, metrics, searchText: `${kindLabels[kind]} ${label} ${subtitle} ${Object.values(metrics).join(" ")}`.toLowerCase() }; nodes.push({ id, type: "network", position: { x: offset.x + (column - 1) * 220, y: offset.y + row * 150 }, data }); }
function addEdge(edges: NetworkGraphEdge[], source: string, target: string, kind: NetworkGraphEdge["kind"] = "relationship", label?: string) { const id = `${source}-${target}-${edges.length}`; if (!edges.some((edge) => edge.source === source && edge.target === target)) edges.push({ id, source, target, label, animated: kind === "derived", kind }); }

export async function GET() {
  try {
    await connectToDatabase();
    const [team, customers, products, orders, expenses, jobs, materials, transactions] = await Promise.all([
      TeamMember.find({ active: true }).lean(), Customer.find({ status: "active" }).lean(), Product.find({ active: true }).lean(), Order.find({ status: { $ne: "cancelled" } }).lean(), Expense.find({ status: { $ne: "voided" } }).lean(), ProductionJob.find({ status: { $ne: "cancelled" } }).lean(), Material.find({ active: true }).lean(), InventoryTransaction.find().lean(),
    ]);
    const nodes: NetworkGraphNode[] = []; const edges: NetworkGraphEdge[] = [];
    const completedOrders = orders.filter((order) => order.status !== "cancelled" && order.paymentStatus !== "refunded" && (order.status === "delivered" || order.paymentStatus === "paid"));
    const productMap = new Map(products.map((product) => [stringId(product._id), product]));
    const revenue = completedOrders.reduce((sum, order) => sum + calculateOrderTotals(order).total, 0);
    const productCost = completedOrders.reduce((sum, order) => sum + order.items.reduce((lineSum, item) => { const product = productMap.get(stringId(item.product)); const cost = item.unitCost ?? (product ? product.materialCost + product.productionCost + product.packagingCost + product.otherCost : 0); return lineSum + cost * item.quantity; }, 0), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = revenue - productCost - expenseTotal;

    addNode(nodes, "genforge", "hub", "GenForge", "Business network", { Orders: orders.length, Revenue: revenue });
    addNode(nodes, "revenue", "revenue", "Revenue", "Completed / paid orders", { Amount: revenue });
    addNode(nodes, "profit", "profit", "Profit", "Revenue - costs - expenses", { Amount: profit });
    addEdge(edges, "genforge", "revenue", "derived"); addEdge(edges, "revenue", "profit", "derived");
    team.forEach((member) => addNode(nodes, `team-${member._id}`, "team", member.name, member.role, { Channel: member.channelFocus }));
    customers.forEach((customer) => addNode(nodes, `customer-${customer._id}`, "customer", customer.name, customer.company ?? customer.phone ?? "Customer", { Orders: orders.filter((order) => refId(order.customer) === stringId(customer._id)).length }));
    products.forEach((product) => addNode(nodes, `product-${product._id}`, "product", product.name, product.sku, { Price: product.sellingPrice, Cost: product.materialCost + product.productionCost + product.packagingCost + product.otherCost }));
    const channels = [...new Set(orders.map((order) => order.channel))]; channels.forEach((channel) => addNode(nodes, `channel-${channel}`, "channel", channelLabels[channel] ?? channel, "Sales channel", { Orders: orders.filter((order) => order.channel === channel).length }));
    orders.forEach((order) => { const orderId = `order-${order._id}`; const total = calculateOrderTotals(order).total; const customer = customers.find((item) => stringId(item._id) === refId(order.customer)); addNode(nodes, orderId, "order", order.orderNumber, customer?.name ?? "Unknown customer", { Revenue: total, Status: order.status }); addEdge(edges, `team-${refId(order.teamMember)}`, orderId); addEdge(edges, orderId, `customer-${refId(order.customer)}`); addEdge(edges, orderId, `channel-${order.channel}`); if (completedOrders.some((item) => stringId(item._id) === stringId(order._id))) addEdge(edges, orderId, "revenue", "derived"); order.items.forEach((item) => { addEdge(edges, orderId, `product-${refId(item.product)}`); }); });
    expenses.forEach((expense) => { const id = `expense-${expense._id}`; addNode(nodes, id, "expense", expense.description, expense.category, { Amount: expense.amount }); addEdge(edges, id, "profit", "derived"); });
    jobs.forEach((job) => { const id = `production-${job._id}`; addNode(nodes, id, "production", `Production ${stringId(job._id).slice(-5)}`, job.status, { Quantity: job.quantity, Printer: job.printer }); addEdge(edges, `order-${refId(job.order)}`, id); addEdge(edges, id, `product-${refId(job.product)}`); if (job.material) addEdge(edges, id, `material-${refId(job.material)}`); });
    materials.forEach((material) => { const id = `material-${material._id}`; addNode(nodes, id, "material", material.name, material.sku, { Quantity: material.currentQuantity, Unit: material.unit, Value: material.currentQuantity * material.costPerUnit }); });
    transactions.forEach((transaction) => { if (transaction.material) addEdge(edges, `material-${refId(transaction.material)}`, "genforge", "relationship", transaction.reason); });
    const nodeIds = new Set(nodes.map((node) => node.id));
    return NextResponse.json({ nodes, edges: edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)), generatedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ error: "Unable to load network data." }, { status: 500 }); }
}
