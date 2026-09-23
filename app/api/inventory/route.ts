import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { materialSchema } from "@/src/lib/validations/inventory";
import Material from "@/src/models/Material";
import Product from "@/src/models/Product";

export const runtime = "nodejs";

function materialStatus(quantity: number, minimum: number) { return quantity <= 0 ? "Out of Stock" : quantity <= minimum ? "Low Stock" : "In Stock"; }
function serializeMaterial(material: { _id: unknown; name: string; sku: string; unit: string; currentQuantity: number; minimumQuantity: number; costPerUnit: number; supplier?: string; active: boolean }) { return { id: String(material._id), name: material.name, sku: material.sku, unit: material.unit, currentQuantity: material.currentQuantity, minimumQuantity: material.minimumQuantity, costPerUnit: material.costPerUnit, inventoryValue: material.currentQuantity * material.costPerUnit, supplier: material.supplier ?? "", active: material.active, status: materialStatus(material.currentQuantity, material.minimumQuantity) as "In Stock" | "Low Stock" | "Out of Stock" }; }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const params = new URL(request.url).searchParams; const search = params.get("search")?.trim(); const active = params.get("active"); const filter: Record<string, unknown> = {};
    if (search) { const expression = new RegExp(escapeRegex(search), "i"); filter.$or = [{ name: expression }, { sku: expression }, { supplier: expression }]; }
    if (active === "true" || active === "false") filter.active = active === "true";
    const [materialRecords, finishedProducts] = await Promise.all([Material.find(filter).sort({ name: 1 }).lean(), Product.countDocuments({ active: true })]);
    const materials = materialRecords.map(serializeMaterial);
    return NextResponse.json({ materials, summary: { totalMaterialValue: materials.filter((material) => material.active).reduce((sum, material) => sum + material.inventoryValue, 0), lowStockItems: materials.filter((material) => material.active && material.status !== "In Stock").length, materials: materials.filter((material) => material.active).length, finishedProducts } });
  } catch { return NextResponse.json({ error: "Unable to load inventory." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try { const parsed = materialSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten().fieldErrors }, { status: 400 }); await connectToDatabase(); const material = await Material.create(parsed.data); return NextResponse.json({ material: serializeMaterial(material.toObject()) }, { status: 201 }); } catch (error) { if (error instanceof Error && "code" in error && error.code === 11000) return NextResponse.json({ error: "A material with this SKU already exists." }, { status: 409 }); return NextResponse.json({ error: "Unable to create material." }, { status: 500 }); }
}
