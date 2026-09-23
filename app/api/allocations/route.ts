import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import { createNotification } from "@/src/lib/notifications";
import { getReportingRange, dateRangeFilter } from "@/src/lib/reporting-period";
import Allocation from "@/src/models/Allocation";
import Customer from "@/src/models/Customer";
import Product from "@/src/models/Product";
import InventoryTransaction from "@/src/models/InventoryTransaction";
import { allocationSchema } from "@/src/lib/validations/allocation";
import AllocationEvent from "@/src/models/AllocationEvent";
import { summarizeAllocation } from "@/src/lib/allocation-service";

function serialize(allocation: Record<string, unknown>, summary: ReturnType<typeof summarizeAllocation>) {
  const sourceProducts = allocation.products as Array<Record<string, unknown>>;
  const products = summary.products.map((item) => ({ ...item, product: sourceProducts.find((source) => String(source.productId && typeof source.productId === "object" && "_id" in source.productId ? source.productId._id : source.productId) === item.productId)?.product ?? null }));
  return {
    id: String(allocation._id),
    personId: String(allocation.personId && typeof allocation.personId === "object" && "_id" in allocation.personId ? allocation.personId._id : allocation.personId),
    personType: allocation.personType,
    person: allocation.person && typeof allocation.person === "object" ? allocation.person : null,
    status: allocation.status,
    products,
    moneyGiven: summary.moneyGiven,
    moneyReturned: summary.moneyReturned,
    notes: String(allocation.notes ?? ""),
    allocatedAt: allocation.allocatedAt,
    createdAt: allocation.createdAt,
    updatedAt: allocation.updatedAt,
    totals: summary.totals,
  };
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const params = new URL(request.url).searchParams;
    const filter: Record<string, unknown> = {};
    const personId = params.get("personId");
    const status = params.get("status");
    if (personId) {
      if (!Types.ObjectId.isValid(personId)) return NextResponse.json({ error: "Invalid person id." }, { status: 400 });
      filter.personId = personId;
    }
    if (status) filter.status = status;
    if (params.get("from") || params.get("to") || params.get("period")) {
      const range = getReportingRange(params);
      if (range.kind === "range") filter.allocatedAt = dateRangeFilter(range);
    }
    const allocations = await Allocation.find(filter).populate("personId", "name type phone company").populate("products.productId", "name sku sellingPrice").sort({ allocatedAt: -1 }).lean();
    const events = await AllocationEvent.find({ allocation: { $in: allocations.map((allocation) => allocation._id) } }).lean();
    return NextResponse.json({ allocations: allocations.map((allocation) => { const normalized = { ...allocation, person: allocation.personId, products: allocation.products.map((item) => ({ ...item, product: item.productId })) }; return serialize(normalized, summarizeAllocation(allocation, events.filter((event) => String(event.allocation) === String(allocation._id)))); }) });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid reporting period.") return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Unable to load allocations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = allocationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    const productIds = parsed.data.products.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) return NextResponse.json({ error: "Each product can only appear once in an allocation." }, { status: 400 });
    await connectToDatabase();
    const [person, products] = await Promise.all([
      Customer.findOne({ _id: parsed.data.personId, status: "active" }).lean(),
      Product.find({ _id: { $in: productIds }, active: true }).lean(),
    ]);
    if (!person) return NextResponse.json({ error: "Selected person was not found." }, { status: 400 });
    if (person.type && person.type !== parsed.data.personType) return NextResponse.json({ error: "Person type does not match the selected person." }, { status: 400 });
    if (products.length !== productIds.length) return NextResponse.json({ error: "One or more selected products were not found." }, { status: 400 });
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const allocationProducts = parsed.data.products.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("Selected product was not found.");
      return { productId: product._id, quantity: item.quantity, unitValue: product.sellingPrice, totalValue: product.sellingPrice * item.quantity, quantitySold: 0, quantityReturned: 0 };
    });
    const session = await mongoose.startSession();
    let allocationId = "";
    try {
      await session.withTransaction(async () => {
        const [allocation] = await Allocation.create([{ personId: person._id, personType: parsed.data.personType, products: allocationProducts, moneyGiven: parsed.data.moneyGiven, moneyReturned: 0, notes: parsed.data.notes, allocatedAt: parsed.data.allocatedAt ?? new Date() }], { session });
        allocationId = String(allocation._id);
        await InventoryTransaction.create(allocationProducts.map((item) => ({ product: item.productId, quantityChange: -item.quantity, reason: "Partner Allocation" as const, date: parsed.data.allocatedAt ?? new Date(), notes: `Product allocation ${allocationId}.` })), { session });
      });
    } finally { await session.endSession(); }
    const allocation = await Allocation.findById(allocationId);
    if (!allocation) throw new Error("Created allocation could not be loaded.");
    await createNotification({ type: "allocation_created", title: "Products Allocated", message: `${person.name} received ${allocationProducts.reduce((sum, item) => sum + item.quantity, 0)} products.`, entityType: "allocation", entityId: String(allocation._id), dedupeKey: `allocation-created-${allocation._id}` });
    const created = await Allocation.findById(allocation._id).populate("personId", "name type phone company").populate("products.productId", "name sku sellingPrice").lean();
    if (!created) throw new Error("Created allocation could not be loaded.");
    return NextResponse.json({ allocation: serialize({ ...created, person: created.personId, products: created.products.map((item) => ({ ...item, product: item.productId })) }, summarizeAllocation(created, [])) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create allocation." }, { status: 500 });
  }
}
