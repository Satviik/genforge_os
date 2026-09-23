import mongoose, { Types } from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { connectToDatabase } from "@/src/lib/mongodb";
import TeamMember from "@/src/models/TeamMember";
import Customer from "@/src/models/Customer";
import Product from "@/src/models/Product";
import Material from "@/src/models/Material";
import InventoryTransaction from "@/src/models/InventoryTransaction";
import Order from "@/src/models/Order";
import Expense from "@/src/models/Expense";
import ProductionJob from "@/src/models/ProductionJob";
import Allocation from "@/src/models/Allocation";
import AllocationEvent from "@/src/models/AllocationEvent";
import Notification from "@/src/models/Notification";
import type { NotificationEntityType, NotificationType } from "@/src/models/Notification";

const DEMO_PREFIX = "DEMO - ";
const DEMO_EMAIL_SUFFIX = "@genforge.local";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadLocalEnv();

function daysAgo(days: number, hour = 10) {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function demoEmail(slug: string) { return `${slug}.demo${DEMO_EMAIL_SUFFIX}`; }
function demoName(name: string) { return `${DEMO_PREFIX}${name}`; }
function orderNumber(slug: string) { return `DEMO-${slug}`; }

async function clearDemoData(session: mongoose.ClientSession) {
  const demoProducts = await Product.find({ sku: /^DEMO-/ }).select("_id").session(session).lean();
  const demoMaterials = await Material.find({ sku: /^DEMO-MAT-/ }).select("_id").session(session).lean();
  const demoCustomers = await Customer.find({ $or: [{ name: /^DEMO - / }, { email: /\.demo@genforge\.local$/ }] }).select("_id").session(session).lean();
  const demoTeam = await TeamMember.find({ $or: [{ name: /^DEMO - / }, { email: /\.demo@genforge\.local$/ }] }).select("_id").session(session).lean();
  const demoOrders = await Order.find({ orderNumber: /^DEMO-/ }).select("_id").session(session).lean();
  const demoAllocations = await Allocation.find({ notes: /^DEMO - / }).select("_id").session(session).lean();
  const demoProduction = await ProductionJob.find({ notes: /^DEMO - / }).select("_id").session(session).lean();

  await Notification.deleteMany({ $or: [{ dedupeKey: /^demo:/ }, { entityId: { $in: [...demoOrders, ...demoAllocations, ...demoProduction].map((item) => item._id) } }] }, { session });
  await AllocationEvent.deleteMany({ allocation: { $in: demoAllocations.map((item) => item._id) } }, { session });
  await InventoryTransaction.deleteMany({ $or: [{ notes: /^DEMO - / }, { product: { $in: demoProducts.map((item) => item._id) } }, { material: { $in: demoMaterials.map((item) => item._id) } }] }, { session });
  await ProductionJob.deleteMany({ _id: { $in: demoProduction.map((item) => item._id) } }, { session });
  await Allocation.deleteMany({ _id: { $in: demoAllocations.map((item) => item._id) } }, { session });
  await Order.deleteMany({ _id: { $in: demoOrders.map((item) => item._id) } }, { session });
  await Expense.deleteMany({ description: /^DEMO - / }, { session });
  await Product.deleteMany({ _id: { $in: demoProducts.map((item) => item._id) } }, { session });
  await Material.deleteMany({ _id: { $in: demoMaterials.map((item) => item._id) } }, { session });
  await Customer.deleteMany({ _id: { $in: demoCustomers.map((item) => item._id) } }, { session });
  await TeamMember.deleteMany({ _id: { $in: demoTeam.map((item) => item._id) } }, { session });
}

async function seedDemoData(session: mongoose.ClientSession) {
  const team = await TeamMember.create([
    { name: demoName("Satvik"), email: demoEmail("satvik"), role: "admin", channelFocus: "Operations", active: true, phone: "9999000001", notes: "DEMO - Founder account" },
    { name: demoName("Ananya"), email: demoEmail("ananya"), role: "marketing", channelFocus: "Instagram", active: true, phone: "9999000002", notes: "DEMO - Marketing" },
    { name: demoName("Rohan"), email: demoEmail("rohan"), role: "sales", channelFocus: "Direct", active: true, phone: "9999000003", notes: "DEMO - Sales" },
    { name: demoName("Neha"), email: demoEmail("neha"), role: "operations", channelFocus: "Production", active: true, phone: "9999000004", notes: "DEMO - Operations" },
  ], { session, ordered: true });

  const people = await Customer.create([
    { name: demoName("Rahul Sharma"), type: "reseller", phone: "9876500001", email: "rahul.demo@genforge.local", notes: "DEMO - Primary reseller allocation", status: "active", createdAt: daysAgo(28), updatedAt: daysAgo(28) },
    { name: demoName("Priya Verma"), type: "customer", phone: "9876500002", email: "priya.demo@genforge.local", notes: "DEMO - Direct customer", status: "active", createdAt: daysAgo(24), updatedAt: daysAgo(24) },
    { name: demoName("Arjun Mehta"), type: "reseller", phone: "9876500003", email: "arjun.demo@genforge.local", notes: "DEMO - Secondary reseller allocation", status: "active", createdAt: daysAgo(17), updatedAt: daysAgo(17) },
    { name: demoName("Sneha Nair"), type: "influencer", phone: "9876500004", email: "sneha.demo@genforge.local", notes: "DEMO - Creator partner", status: "active", createdAt: daysAgo(11), updatedAt: daysAgo(11) },
    { name: demoName("Vikram Rao"), type: "business", phone: "9876500005", email: "vikram.demo@genforge.local", company: "DEMO Studio Works", notes: "DEMO - Business buyer", status: "active", createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  ], { session, ordered: true });

  const products = await Product.create([
    { name: demoName("Dragon Lamp"), sku: "DEMO-DRAGON-LAMP", category: "Lighting", description: "DEMO - Layered 3D printed dragon lamp.", sellingPrice: 1499, materialCost: 300, productionCost: 150, packagingCost: 80, otherCost: 20, active: true, createdAt: daysAgo(28), updatedAt: daysAgo(28) },
    { name: demoName("Mouse Stand"), sku: "DEMO-MOUSE-STAND", category: "Desk Accessories", description: "DEMO - Ergonomic printed mouse stand.", sellingPrice: 899, materialCost: 180, productionCost: 100, packagingCost: 50, otherCost: 15, active: true, createdAt: daysAgo(24), updatedAt: daysAgo(24) },
    { name: demoName("Keychain"), sku: "DEMO-KEYCHAIN", category: "Gifts", description: "DEMO - Compact custom keychain.", sellingPrice: 249, materialCost: 35, productionCost: 25, packagingCost: 15, otherCost: 5, active: true, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
    { name: demoName("Desk Organizer"), sku: "DEMO-DESK-ORGANIZER", category: "Desk Accessories", description: "DEMO - Modular desk organizer.", sellingPrice: 699, materialCost: 140, productionCost: 90, packagingCost: 45, otherCost: 12, active: true, createdAt: daysAgo(13), updatedAt: daysAgo(13) },
    { name: demoName("Mini Planter"), sku: "DEMO-MINI-PLANTER", category: "Home", description: "DEMO - Small geometric planter.", sellingPrice: 499, materialCost: 90, productionCost: 55, packagingCost: 35, otherCost: 10, active: true, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  ], { session, ordered: true });

  const materials = await Material.create([
    { name: demoName("PLA Filament"), sku: "DEMO-MAT-PLA", unit: "kg", currentQuantity: 18, minimumQuantity: 5, costPerUnit: 1200, supplier: "DEMO Materials Co.", active: true, createdAt: daysAgo(26), updatedAt: daysAgo(26) },
    { name: demoName("Packaging Boxes"), sku: "DEMO-MAT-BOX", unit: "units", currentQuantity: 4, minimumQuantity: 10, costPerUnit: 25, supplier: "DEMO Pack Supply", active: true, createdAt: daysAgo(19), updatedAt: daysAgo(19) },
    { name: demoName("Resin Supply"), sku: "DEMO-MAT-RESIN", unit: "litres", currentQuantity: 8, minimumQuantity: 3, costPerUnit: 950, supplier: "DEMO Resin Supply", active: true, createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  ], { session, ordered: true });

  const product = Object.fromEntries(products.map((item) => [item.sku, item]));
  const person = Object.fromEntries(people.map((item) => [item.email, item]));
  const member = Object.fromEntries(team.map((item) => [item.email, item]));
  const material = Object.fromEntries(materials.map((item) => [item.sku, item]));

  await InventoryTransaction.create([
    { material: material["DEMO-MAT-PLA"]._id, quantityChange: 20, reason: "Purchase", date: daysAgo(26), user: member[demoEmail("neha")]._id, notes: "DEMO - Initial PLA stock" },
    { material: material["DEMO-MAT-BOX"]._id, quantityChange: 24, reason: "Purchase", date: daysAgo(19), user: member[demoEmail("neha")]._id, notes: "DEMO - Initial packaging stock" },
    { material: material["DEMO-MAT-RESIN"]._id, quantityChange: 8, reason: "Purchase", date: daysAgo(9), user: member[demoEmail("neha")]._id, notes: "DEMO - Initial resin stock" },
  ], { session, ordered: true });

  async function createOrder(data: { slug: string; customer: Types.ObjectId; partner?: Types.ObjectId; allocation?: Types.ObjectId; productId: Types.ObjectId; productName: string; sku: string; quantity: number; unitPrice: number; channel: "website" | "instagram" | "direct" | "whatsapp" | "marketplace" | "other"; paymentStatus: "pending" | "partial" | "paid" | "refunded"; paidAmount: number; date: Date }) {
    const [created] = await Order.create([{ orderNumber: orderNumber(data.slug), customer: data.customer, teamMember: member[demoEmail("rohan")]._id, partner: data.partner, allocation: data.allocation, items: [{ product: data.productId, productName: data.productName, sku: data.sku, quantity: data.quantity, unitPrice: data.unitPrice }], discount: 0, shipping: 0, status: "delivered", paymentStatus: data.paymentStatus, paymentMethod: data.paymentStatus === "paid" ? "upi" : undefined, paidAmount: data.paidAmount, channel: data.channel, notes: "DEMO - Seeded order", timeline: [{ status: "delivered", at: data.date }], createdAt: data.date, updatedAt: data.date }], { session, ordered: true });
    return created;
  }

  const rahulAllocation = (await Allocation.create([{ personId: person["rahul.demo@genforge.local"]._id, personType: "reseller", status: "partially_settled", products: [{ productId: product["DEMO-DRAGON-LAMP"]._id, quantity: 10, unitValue: 1499, totalValue: 14990, quantitySold: 0, quantityReturned: 0 }, { productId: product["DEMO-MOUSE-STAND"]._id, quantity: 5, unitValue: 899, totalValue: 4495, quantitySold: 0, quantityReturned: 0 }], moneyGiven: 5000, moneyReturned: 0, notes: "DEMO - Rahul partner allocation", allocatedAt: daysAgo(12) }], { session, ordered: true }))[0];
  const arjunAllocation = (await Allocation.create([{ personId: person["arjun.demo@genforge.local"]._id, personType: "reseller", status: "partially_settled", products: [{ productId: product["DEMO-MOUSE-STAND"]._id, quantity: 8, unitValue: 899, totalValue: 7192, quantitySold: 0, quantityReturned: 0 }, { productId: product["DEMO-KEYCHAIN"]._id, quantity: 20, unitValue: 249, totalValue: 4980, quantitySold: 0, quantityReturned: 0 }], moneyGiven: 3000, moneyReturned: 0, notes: "DEMO - Arjun partner allocation", allocatedAt: daysAgo(7) }], { session, ordered: true }))[0];

  const rahulDragonOrder = await createOrder({ slug: "ORDER-RAHUL-DRAGON", customer: person["priya.demo@genforge.local"]._id, partner: rahulAllocation.personId, allocation: rahulAllocation._id, productId: product["DEMO-DRAGON-LAMP"]._id, productName: product["DEMO-DRAGON-LAMP"].name, sku: product["DEMO-DRAGON-LAMP"].sku, quantity: 3, unitPrice: 1499, channel: "instagram", paymentStatus: "paid", paidAmount: 4497, date: daysAgo(6) });
  const rahulMouseOrder = await createOrder({ slug: "ORDER-RAHUL-MOUSE", customer: person["sneha.demo@genforge.local"]._id, partner: rahulAllocation.personId, allocation: rahulAllocation._id, productId: product["DEMO-MOUSE-STAND"]._id, productName: product["DEMO-MOUSE-STAND"].name, sku: product["DEMO-MOUSE-STAND"].sku, quantity: 2, unitPrice: 899, channel: "direct", paymentStatus: "partial", paidAmount: 900, date: daysAgo(4) });
  const arjunMouseOrder = await createOrder({ slug: "ORDER-ARJUN-MOUSE", customer: person["vikram.demo@genforge.local"]._id, partner: arjunAllocation.personId, allocation: arjunAllocation._id, productId: product["DEMO-MOUSE-STAND"]._id, productName: product["DEMO-MOUSE-STAND"].name, sku: product["DEMO-MOUSE-STAND"].sku, quantity: 4, unitPrice: 899, channel: "marketplace", paymentStatus: "paid", paidAmount: 3596, date: daysAgo(3) });
  const arjunKeychainOrder = await createOrder({ slug: "ORDER-ARJUN-KEYCHAIN", customer: person["priya.demo@genforge.local"]._id, partner: arjunAllocation.personId, allocation: arjunAllocation._id, productId: product["DEMO-KEYCHAIN"]._id, productName: product["DEMO-KEYCHAIN"].name, sku: product["DEMO-KEYCHAIN"].sku, quantity: 8, unitPrice: 249, channel: "whatsapp", paymentStatus: "paid", paidAmount: 1992, date: daysAgo(1) });

  const directOrders = await Promise.all([
    createOrder({ slug: "ORDER-PRIYA-DRAGON", customer: person["priya.demo@genforge.local"]._id, productId: product["DEMO-DRAGON-LAMP"]._id, productName: product["DEMO-DRAGON-LAMP"].name, sku: product["DEMO-DRAGON-LAMP"].sku, quantity: 1, unitPrice: 1499, channel: "website", paymentStatus: "paid", paidAmount: 1499, date: daysAgo(21) }),
    createOrder({ slug: "ORDER-PRIYA-KEYCHAINS", customer: person["priya.demo@genforge.local"]._id, productId: product["DEMO-KEYCHAIN"]._id, productName: product["DEMO-KEYCHAIN"].name, sku: product["DEMO-KEYCHAIN"].sku, quantity: 4, unitPrice: 249, channel: "instagram", paymentStatus: "paid", paidAmount: 996, date: daysAgo(10) }),
    createOrder({ slug: "ORDER-VIKRAM-ORGANIZER", customer: person["vikram.demo@genforge.local"]._id, productId: product["DEMO-DESK-ORGANIZER"]._id, productName: product["DEMO-DESK-ORGANIZER"].name, sku: product["DEMO-DESK-ORGANIZER"].sku, quantity: 5, unitPrice: 699, channel: "direct", paymentStatus: "pending", paidAmount: 0, date: daysAgo(2) }),
    createOrder({ slug: "ORDER-SNEHA-PLANTER", customer: person["sneha.demo@genforge.local"]._id, productId: product["DEMO-MINI-PLANTER"]._id, productName: product["DEMO-MINI-PLANTER"].name, sku: product["DEMO-MINI-PLANTER"].sku, quantity: 2, unitPrice: 499, channel: "marketplace", paymentStatus: "paid", paidAmount: 998, date: daysAgo(0, 14) }),
  ]);

  await AllocationEvent.create([
    { allocation: rahulAllocation._id, type: "sale", product: product["DEMO-DRAGON-LAMP"]._id, quantity: 3, unitPrice: 1499, date: daysAgo(6), channel: "instagram", customer: person["priya.demo@genforge.local"]._id, teamMember: member[demoEmail("rohan")]._id, order: rahulDragonOrder._id, notes: "DEMO - Rahul Dragon Lamp sale" },
    { allocation: rahulAllocation._id, type: "sale", product: product["DEMO-MOUSE-STAND"]._id, quantity: 2, unitPrice: 899, date: daysAgo(4), channel: "direct", customer: person["sneha.demo@genforge.local"]._id, teamMember: member[demoEmail("rohan")]._id, order: rahulMouseOrder._id, notes: "DEMO - Rahul Mouse Stand sale" },
    { allocation: rahulAllocation._id, type: "return", product: product["DEMO-DRAGON-LAMP"]._id, quantity: 1, date: daysAgo(2), reason: "DEMO - Packaging damage", notes: "DEMO - Rahul Dragon Lamp return" },
    { allocation: rahulAllocation._id, type: "payment", amount: 2000, date: daysAgo(1), paymentMethod: "bank_transfer", reference: "DEMO-RAHUL-2000", notes: "DEMO - Rahul settlement payment" },
    { allocation: arjunAllocation._id, type: "sale", product: product["DEMO-MOUSE-STAND"]._id, quantity: 4, unitPrice: 899, date: daysAgo(3), channel: "marketplace", customer: person["vikram.demo@genforge.local"]._id, teamMember: member[demoEmail("rohan")]._id, order: arjunMouseOrder._id, notes: "DEMO - Arjun Mouse Stand sale" },
    { allocation: arjunAllocation._id, type: "sale", product: product["DEMO-KEYCHAIN"]._id, quantity: 8, unitPrice: 249, date: daysAgo(1), channel: "whatsapp", customer: person["priya.demo@genforge.local"]._id, teamMember: member[demoEmail("rohan")]._id, order: arjunKeychainOrder._id, notes: "DEMO - Arjun Keychain sale" },
    { allocation: arjunAllocation._id, type: "payment", amount: 1500, date: daysAgo(0, 11), paymentMethod: "upi", reference: "DEMO-ARJUN-1500", notes: "DEMO - Arjun settlement payment" },
  ], { session, ordered: true });

  await InventoryTransaction.create([
    { product: product["DEMO-DRAGON-LAMP"]._id, quantityChange: -10, reason: "Partner Allocation", date: daysAgo(12), notes: "DEMO - Rahul Dragon Lamp allocation" },
    { product: product["DEMO-MOUSE-STAND"]._id, quantityChange: -5, reason: "Partner Allocation", date: daysAgo(12), notes: "DEMO - Rahul Mouse Stand allocation" },
    { product: product["DEMO-MOUSE-STAND"]._id, quantityChange: -8, reason: "Partner Allocation", date: daysAgo(7), notes: "DEMO - Arjun Mouse Stand allocation" },
    { product: product["DEMO-KEYCHAIN"]._id, quantityChange: -20, reason: "Partner Allocation", date: daysAgo(7), notes: "DEMO - Arjun Keychain allocation" },
    { product: product["DEMO-DRAGON-LAMP"]._id, quantityChange: -3, reason: "Partner Sale", date: daysAgo(6), notes: "DEMO - Rahul Dragon Lamp sale" },
    { product: product["DEMO-MOUSE-STAND"]._id, quantityChange: -2, reason: "Partner Sale", date: daysAgo(4), notes: "DEMO - Rahul Mouse Stand sale" },
    { product: product["DEMO-DRAGON-LAMP"]._id, quantityChange: 1, reason: "Partner Return", date: daysAgo(2), notes: "DEMO - Rahul Dragon Lamp return" },
    { product: product["DEMO-MOUSE-STAND"]._id, quantityChange: -4, reason: "Partner Sale", date: daysAgo(3), notes: "DEMO - Arjun Mouse Stand sale" },
    { product: product["DEMO-KEYCHAIN"]._id, quantityChange: -8, reason: "Partner Sale", date: daysAgo(1), notes: "DEMO - Arjun Keychain sale" },
  ], { session, ordered: true });

  await Expense.create([
    { description: demoName("Material purchase"), amount: 4500, category: "Filament / Materials", date: daysAgo(26), status: "paid", paymentMethod: "bank_transfer", addedBy: member[demoEmail("neha")]._id, notes: "DEMO - PLA and resin purchase" },
    { description: demoName("Packaging"), amount: 1200, category: "Packaging", date: daysAgo(18), status: "paid", paymentMethod: "upi", addedBy: member[demoEmail("neha")]._id, notes: "DEMO - Packaging supplies" },
    { description: demoName("Electricity"), amount: 1800, category: "Electricity", date: daysAgo(12), status: "paid", paymentMethod: "bank_transfer", addedBy: member[demoEmail("neha")]._id, notes: "DEMO - Workshop electricity" },
    { description: demoName("Marketing"), amount: 2000, category: "Marketing", date: daysAgo(7), status: "paid", paymentMethod: "card", addedBy: member[demoEmail("ananya")]._id, notes: "DEMO - Social promotion" },
    { description: demoName("Shipping"), amount: 950, category: "Shipping", date: daysAgo(1), status: "paid", paymentMethod: "upi", addedBy: member[demoEmail("rohan")]._id, notes: "DEMO - Partner and customer shipping" },
  ], { session, ordered: true });

  const productionSpecs = [
    { slug: "PROD-DRAGON", order: directOrders[0], product: product["DEMO-DRAGON-LAMP"], quantity: 10, status: "ready" as const, date: daysAgo(20), printer: "DEMO Forge-01" },
    { slug: "PROD-MOUSE", order: directOrders[1], product: product["DEMO-MOUSE-STAND"], quantity: 8, status: "ready" as const, date: daysAgo(14), printer: "DEMO Forge-02" },
    { slug: "PROD-ORGANIZER", order: directOrders[2], product: product["DEMO-DESK-ORGANIZER"], quantity: 15, status: "printing" as const, date: daysAgo(5), printer: "DEMO Forge-01" },
    { slug: "PROD-PLANTER", order: directOrders[3], product: product["DEMO-MINI-PLANTER"], quantity: 20, status: "queued" as const, date: daysAgo(1), printer: "DEMO Forge-03" },
  ];
  const productionJobs = await ProductionJob.create(productionSpecs.map((item) => ({ order: item.order._id, product: item.product._id, quantity: item.quantity, printer: item.printer, material: material["DEMO-MAT-PLA"]._id, materialUsed: item.quantity * 0.12, estimatedPrintTime: item.quantity * 45, actualPrintTime: item.status === "ready" ? item.quantity * 42 : undefined, status: item.status, startedAt: item.status === "queued" ? undefined : item.date, completedAt: item.status === "ready" ? item.date : undefined, notes: `DEMO - ${item.slug}; ready means completed in the current production schema.`, timeline: [{ status: item.status, at: item.date }], createdAt: item.date, updatedAt: item.date })), { session, ordered: true });

  const notificationRows: Array<{ type: NotificationType; title: string; message: string; entityType: NotificationEntityType; entityId: Types.ObjectId }> = [
    { type: "order_created", title: "New order", message: `${people[1].name} placed a demo order.`, entityType: "order", entityId: directOrders[0]._id },
    { type: "allocation_sale", title: "Partner Sale", message: `${people[0].name} sold 3 Dragon Lamps.`, entityType: "allocation", entityId: rahulAllocation._id },
    { type: "allocation_payment", title: "Payment Received", message: `₹2,000 received from ${people[0].name}.`, entityType: "allocation", entityId: rahulAllocation._id },
    { type: "allocation_created", title: "Products Allocated", message: `15 products allocated to ${people[0].name}.`, entityType: "allocation", entityId: rahulAllocation._id },
    { type: "production_job_completed", title: "Production complete", message: "10 Dragon Lamps completed production.", entityType: "production", entityId: productionJobs[0]._id },
    { type: "inventory_low_stock", title: "Low stock", message: "Packaging Boxes are below the demo minimum.", entityType: "inventory", entityId: material["DEMO-MAT-BOX"]._id },
  ];
  await Notification.create(notificationRows.map((row, index) => ({ ...row, entityId: new Types.ObjectId(row.entityId), read: index > 3, dedupeKey: `demo:${row.type}:${String(row.entityId)}`, metadata: { demo: 1 }, createdAt: daysAgo(Math.max(0, 5 - index)), updatedAt: daysAgo(Math.max(0, 5 - index)) })), { session, ordered: true });

  return { team: team.length, people: people.length, products: products.length, materials: materials.length, orders: directOrders.length + 4, expenses: 5, allocations: 2, allocationEvents: 7, production: productionJobs.length, notifications: notificationRows.length };
}

async function main() {
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    let result: Record<string, number> = {};
    await session.withTransaction(async () => {
      await clearDemoData(session);
      if (!process.argv.includes("--clear")) result = await seedDemoData(session);
    });
    console.log(process.argv.includes("--clear") ? "Cleared DEMO records only." : `Seeded DEMO dataset: ${JSON.stringify(result)}`);
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error("Demo seed failed:", error); process.exitCode = 1; });
