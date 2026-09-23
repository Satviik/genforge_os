import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import Allocation, { type AllocationDocument, type IAllocationProduct } from "@/src/models/Allocation";
import { allocationPatchSchema } from "@/src/lib/validations/allocation";
import { getAllocationEvents, serializeAllocationActivity } from "@/src/lib/allocation-service";

type RouteContext = { params: Promise<{ id: string }> };

async function getAllocation(id: string) {
  return Allocation.findById(id).populate("personId", "name type phone company").populate("products.productId", "name sku sellingPrice").lean();
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid allocation id." }, { status: 400 });
    await connectToDatabase();
    const allocation = await getAllocation(id);
    if (!allocation) return NextResponse.json({ error: "Allocation not found." }, { status: 404 });
    const events = await getAllocationEvents(id);
    return NextResponse.json({ allocation: serializeAllocationActivity(allocation as unknown as AllocationDocument & { personId?: unknown; products: (IAllocationProduct & { productId?: unknown })[] }, events) });
  } catch {
    return NextResponse.json({ error: "Unable to load allocation." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid allocation id." }, { status: 400 });
    const parsed = allocationPatchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    await connectToDatabase();
    const allocation = await Allocation.findById(id);
    if (!allocation) return NextResponse.json({ error: "Allocation not found." }, { status: 404 });
    if (parsed.data.status !== undefined) {
      allocation.status = parsed.data.status;
    }
    if (parsed.data.notes !== undefined) allocation.notes = parsed.data.notes;
    await allocation.save();
    const updated = await getAllocation(id);
    if (!updated) return NextResponse.json({ error: "Allocation not found." }, { status: 404 });
    const events = await getAllocationEvents(id);
    return NextResponse.json({ allocation: serializeAllocationActivity(updated as unknown as AllocationDocument & { personId?: unknown; products: (IAllocationProduct & { productId?: unknown })[] }, events) });
  } catch {
    return NextResponse.json({ error: "Unable to update allocation." }, { status: 500 });
  }
}
