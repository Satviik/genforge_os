import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import { createNotification } from "@/src/lib/notifications";
import { allocationReturnSchema } from "@/src/lib/validations/allocation-actions";
import Allocation from "@/src/models/Allocation";
import AllocationEvent from "@/src/models/AllocationEvent";
import Customer from "@/src/models/Customer";
import InventoryTransaction from "@/src/models/InventoryTransaction";
import Product from "@/src/models/Product";

type RouteContext = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid allocation id." }, { status: 400 });
    const parsed = allocationReturnSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const session = await mongoose.startSession();
    let partnerName = "Partner";
    let productName = "Product";
    try {
      await session.withTransaction(async () => {
        const allocation = await Allocation.findById(id).session(session);
        if (!allocation) throw new Error("Allocation not found.");
        const item = allocation.products.find((entry) => String(entry.productId) === parsed.data.productId);
        if (!item) throw new Error("Product is not part of this allocation.");
        const previousEvents = await AllocationEvent.find({ allocation: id, product: parsed.data.productId }).session(session).lean();
        const sold = previousEvents.filter((event) => event.type === "sale").reduce((sum, event) => sum + (event.quantity ?? 0), 0);
        const returned = previousEvents.filter((event) => event.type === "return").reduce((sum, event) => sum + (event.quantity ?? 0), 0);
        if (parsed.data.quantity > item.quantity - sold - returned) throw new Error("Return quantity exceeds the partner's remaining quantity.");
        const [person, product] = await Promise.all([Customer.findById(allocation.personId).session(session).lean(), Product.findById(parsed.data.productId).session(session).lean()]);
        if (!person || !product) throw new Error("Allocation references unavailable data.");
        partnerName = person.name;
        productName = product.name;
        const date = parsed.data.returnDate ?? new Date();
        await AllocationEvent.create([{ allocation: allocation._id, type: "return", product: product._id, quantity: parsed.data.quantity, date, reason: parsed.data.reason, notes: parsed.data.notes }], { session });
        await InventoryTransaction.create([{ product: product._id, quantityChange: parsed.data.quantity, reason: "Partner Return", date, notes: `Partner return against allocation ${id}.` }], { session });
      });
    } finally { await session.endSession(); }
    await createNotification({ type: "allocation_return", title: "Product Returned", message: `${partnerName} returned ${parsed.data.quantity} ${productName}${parsed.data.quantity === 1 ? "" : "s"}.`, entityType: "allocation", entityId: id, dedupeKey: `allocation-return:${id}:${Date.now()}` });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to record product return." }, { status: 400 }); }
}
