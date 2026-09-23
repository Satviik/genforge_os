import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateOrderTotals } from "@/src/lib/order-calculations";
import Allocation from "@/src/models/Allocation";
import Customer from "@/src/models/Customer";
import Order from "@/src/models/Order";
import { customerUpdateSchema } from "@/src/lib/validations/customer";
import AllocationEvent from "@/src/models/AllocationEvent";
import { serializeAllocationActivity, summarizeAllocation } from "@/src/lib/allocation-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid person id." }, { status: 400 });
    await connectToDatabase();
    const [person, allocations, orders] = await Promise.all([Customer.findById(id).lean(), Allocation.find({ personId: id, status: { $ne: "cancelled" } }).populate("personId", "name type phone company").populate("products.productId", "name sku").sort({ allocatedAt: -1 }).lean(), Order.find({ $or: [{ customer: id }, { partner: id }], status: { $ne: "cancelled" } }).sort({ createdAt: -1 }).lean()]);
    const allocationEvents = await AllocationEvent.find({ allocation: { $in: allocations.map((allocation) => allocation._id) } }).populate("product", "name sku").sort({ date: -1, createdAt: -1 }).lean();
    if (!person) return NextResponse.json({ error: "Person not found." }, { status: 404 });
    const summaries = allocations.map((allocation) => summarizeAllocation(allocation, allocationEvents.filter((event) => String(event.allocation) === String(allocation._id))));
    const productsHeld = summaries.reduce((sum, allocation) => sum + allocation.totals.remainingUnits, 0);
    const salesGenerated = orders.reduce((sum, order) => sum + calculateOrderTotals(order).total, 0);
    const unitsSold = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const serializedAllocations = allocations.map((allocation) => serializeAllocationActivity(allocation, allocationEvents.filter((event) => String(event.allocation) === String(allocation._id))));
    return NextResponse.json({ person: { id: String(person._id), name: person.name, type: person.type ?? "customer", phone: person.phone ?? "", company: person.company ?? "", email: person.email ?? "", joined: person.createdAt }, allocations: serializedAllocations, orders: orders.map((order) => ({ id: String(order._id), orderNumber: order.orderNumber, total: calculateOrderTotals(order).total, status: order.status, createdAt: order.createdAt })), totals: { productsHeld, salesGenerated, orders: orders.length, unitsSold, moneyGiven: summaries.reduce((sum, allocation) => sum + allocation.moneyGiven, 0), moneyReturned: summaries.reduce((sum, allocation) => sum + allocation.moneyReturned, 0), outstandingAmount: summaries.reduce((sum, allocation) => sum + allocation.outstandingAmount, 0) } });
  } catch { return NextResponse.json({ error: "Unable to load person." }, { status: 500 }); }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid person id." }, { status: 400 });
    const parsed = customerUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const person = await Customer.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true }).lean();
    if (!person) return NextResponse.json({ error: "Person not found." }, { status: 404 });
    return NextResponse.json({ person: { id: String(person._id), name: person.name, type: person.type, phone: person.phone ?? "", email: person.email ?? "", notes: person.notes ?? "", active: person.status === "active", createdAt: person.createdAt, updatedAt: person.updatedAt } });
  } catch { return NextResponse.json({ error: "Unable to update person." }, { status: 500 }); }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid person id." }, { status: 400 });
    await connectToDatabase();
    const person = await Customer.findByIdAndUpdate(id, { status: "inactive" }, { new: true, runValidators: true }).lean();
    if (!person) return NextResponse.json({ error: "Person not found." }, { status: 404 });
    return NextResponse.json({ person: { id: String(person._id), name: person.name, type: person.type, status: person.status } });
  } catch { return NextResponse.json({ error: "Unable to archive person." }, { status: 500 }); }
}
