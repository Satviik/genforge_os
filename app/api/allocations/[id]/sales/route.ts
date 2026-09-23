import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import { createNotification } from "@/src/lib/notifications";
import { allocationSaleSchema } from "@/src/lib/validations/allocation-actions";
import Allocation from "@/src/models/Allocation";
import AllocationEvent from "@/src/models/AllocationEvent";
import Customer from "@/src/models/Customer";
import InventoryTransaction from "@/src/models/InventoryTransaction";
import Order from "@/src/models/Order";
import Product from "@/src/models/Product";
import TeamMember from "@/src/models/TeamMember";

type RouteContext = { params: Promise<{ id: string }> };
function orderNumber() { return `GF-PARTNER-${Date.now().toString(36).toUpperCase()}`; }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid allocation id." }, { status: 400 });
    const parsed = allocationSaleSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const session = await mongoose.startSession();
    let partnerName = "Partner";
  let productName = "Product";
    let createdOrderId: Types.ObjectId | null = null;
    try {
      await session.withTransaction(async () => {
        const allocation = await Allocation.findById(id).session(session);
        if (!allocation) throw new Error("Allocation not found.");
        const item = allocation.products.find((entry) => String(entry.productId) === parsed.data.productId);
        if (!item) throw new Error("Product is not part of this allocation.");
        const previousEvents = await AllocationEvent.find({ allocation: id, type: { $in: ["sale", "return"] } }).session(session).lean();
        const sold = previousEvents.filter((event) => String(event.product) === parsed.data.productId && event.type === "sale").reduce((sum, event) => sum + (event.quantity ?? 0), 0);
        const returned = previousEvents.filter((event) => String(event.product) === parsed.data.productId && event.type === "return").reduce((sum, event) => sum + (event.quantity ?? 0), 0);
        if (parsed.data.quantity > item.quantity - sold - returned) throw new Error("Sale quantity exceeds the partner's remaining quantity.");
        const [person, product] = await Promise.all([Customer.findById(allocation.personId).session(session).lean(), Product.findById(parsed.data.productId).session(session).lean()]);
        if (!person || !product) throw new Error("Allocation references unavailable data.");
        partnerName = person.name;
        productName = product.name;
        let order;
        if (parsed.data.customerId && parsed.data.teamMemberId) {
          const [customer, teamMember] = await Promise.all([Customer.findOne({ _id: parsed.data.customerId, status: "active" }).session(session), TeamMember.findOne({ _id: parsed.data.teamMemberId, active: true }).session(session)]);
          if (!customer || !teamMember) throw new Error("Selected customer or team member was not found.");
          order = await Order.create([{ orderNumber: orderNumber(), customer: customer._id, teamMember: teamMember._id, partner: person._id, allocation: allocation._id, items: [{ product: product._id, productName: product.name, sku: product.sku, quantity: parsed.data.quantity, unitPrice: parsed.data.unitPrice }], discount: 0, shipping: 0, status: "delivered", paymentStatus: parsed.data.paymentStatus, paymentMethod: parsed.data.paymentMethod, paidAmount: parsed.data.paidAmount, channel: parsed.data.channel, notes: parsed.data.notes, timeline: [{ status: "delivered", at: parsed.data.saleDate ?? new Date() }] }], { session });
          createdOrderId = order[0]._id;
        }
        await AllocationEvent.create([{ allocation: allocation._id, type: "sale", product: product._id, quantity: parsed.data.quantity, unitPrice: parsed.data.unitPrice, date: parsed.data.saleDate ?? new Date(), channel: parsed.data.channel, customer: parsed.data.customerId || undefined, teamMember: parsed.data.teamMemberId || undefined, order: createdOrderId ?? undefined, notes: parsed.data.notes }], { session });
        await InventoryTransaction.create([{ product: product._id, quantityChange: -parsed.data.quantity, reason: "Partner Sale", date: parsed.data.saleDate ?? new Date(), notes: `Partner sale against allocation ${id}.` }], { session });
      });
    } finally { await session.endSession(); }
    await createNotification({ type: "allocation_sale", title: "Partner Sale", message: `${partnerName} sold ${parsed.data.quantity} ${productName}${parsed.data.quantity === 1 ? "" : "s"}.`, entityType: "allocation", entityId: id, dedupeKey: `allocation-sale:${id}:${Date.now()}` });
    return NextResponse.json({ orderId: createdOrderId ? String(createdOrderId) : null }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to record partner sale." }, { status: 400 }); }
}
