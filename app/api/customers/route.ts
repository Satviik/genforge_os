import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateOrderTotals } from "@/src/lib/order-calculations";
import Allocation from "@/src/models/Allocation";
import Customer from "@/src/models/Customer";
import Order from "@/src/models/Order";
import AllocationEvent from "@/src/models/AllocationEvent";
import { summarizeAllocation } from "@/src/lib/allocation-service";
import { customerSchema } from "@/src/lib/validations/customer";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const params = new URL(request.url).searchParams;
    const filter: Record<string, unknown> = { status: params.get("includeInactive") === "true" ? { $in: ["active", "inactive"] } : "active" };
    const search = params.get("search")?.trim();
    const type = params.get("type");
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
    if (type) filter.type = type;
    const [customers, orders, allocations] = await Promise.all([Customer.find(filter).sort({ name: 1 }).lean(), Order.find({ status: { $ne: "cancelled" } }).lean(), Allocation.find({ status: { $ne: "cancelled" } }).lean()]);
    const allocationEvents = await AllocationEvent.find({ allocation: { $in: allocations.map((allocation) => allocation._id) } }).lean();
    const people = customers.map((customer) => {
      const personOrders = orders.filter((order) => String(order.customer) === String(customer._id) || String(order.partner ?? "") === String(customer._id));
      const personAllocations = allocations.filter((allocation) => String(allocation.personId) === String(customer._id));
      const personSummaries = personAllocations.map((allocation) => summarizeAllocation(allocation, allocationEvents.filter((event) => String(event.allocation) === String(allocation._id))));
      const productsHeld = personSummaries.reduce((sum, allocation) => sum + allocation.totals.remainingUnits, 0);
      const outstanding = personSummaries.reduce((sum, allocation) => sum + allocation.outstandingAmount, 0);
      return { id: String(customer._id), name: customer.name, type: customer.type ?? "customer", phone: customer.phone ?? "", company: customer.company ?? "", status: customer.status, orders: personOrders.length, revenue: personOrders.reduce((sum, order) => sum + calculateOrderTotals(order).total, 0), productsHeld, outstanding, joined: customer.createdAt };
    });
    return NextResponse.json({ people, summary: { total: people.length, customers: people.filter((person) => person.type === "customer").length, resellers: people.filter((person) => person.type === "reseller").length, influencers: people.filter((person) => person.type === "influencer").length, businesses: people.filter((person) => person.type === "business").length } });
  } catch { return NextResponse.json({ error: "Unable to load people." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const parsed = customerSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const person = await Customer.create({ ...parsed.data, status: "active" });
    return NextResponse.json({ person: { id: String(person._id), name: person.name, type: person.type, phone: person.phone ?? "", email: person.email ?? "", notes: person.notes ?? "", active: person.status === "active", createdAt: person.createdAt, updatedAt: person.updatedAt } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create person." }, { status: 500 });
  }
}
