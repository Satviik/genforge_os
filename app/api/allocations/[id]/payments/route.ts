import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import { createNotification } from "@/src/lib/notifications";
import { allocationPaymentSchema } from "@/src/lib/validations/allocation-actions";
import Allocation from "@/src/models/Allocation";
import AllocationEvent from "@/src/models/AllocationEvent";
import Customer from "@/src/models/Customer";

type RouteContext = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid allocation id." }, { status: 400 });
    const parsed = allocationPaymentSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const session = await mongoose.startSession();
    let partnerName = "Partner";
    try {
      await session.withTransaction(async () => {
        const allocation = await Allocation.findById(id).session(session);
        if (!allocation) throw new Error("Allocation not found.");
        const returned = await AllocationEvent.aggregate([{ $match: { allocation: allocation._id, type: "payment" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).session(session);
        const moneyReturned = Number(returned[0]?.total ?? 0);
        if (moneyReturned + parsed.data.amount > allocation.moneyGiven) throw new Error("Payment cannot exceed money given.");
        const person = await Customer.findById(allocation.personId).session(session).lean();
        if (!person) throw new Error("Allocation person was not found.");
        partnerName = person.name;
        await AllocationEvent.create([{ allocation: allocation._id, type: "payment", amount: parsed.data.amount, date: parsed.data.paymentDate ?? new Date(), paymentMethod: parsed.data.paymentMethod, reference: parsed.data.reference, notes: parsed.data.notes }], { session });
      });
    } finally { await session.endSession(); }
    await createNotification({ type: "allocation_payment", title: "Payment Received", message: `${parsed.data.amount} received from ${partnerName}.`, entityType: "allocation", entityId: id, dedupeKey: `allocation-payment:${id}:${Date.now()}` });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to record payment." }, { status: 400 }); }
}
