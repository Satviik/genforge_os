import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateProductMetrics } from "@/src/lib/product-calculations";
import { productSchema } from "@/src/lib/validations/product";
import Product from "@/src/models/Product";
import { createNotification } from "@/src/lib/notifications";

export const runtime = "nodejs";

function serializeProduct(product: {
  _id: unknown;
  name: string;
  sku: string;
  category?: string;
  description?: string;
  sellingPrice: number;
  materialCost: number;
  productionCost: number;
  packagingCost: number;
  otherCost: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(product._id),
    name: product.name,
    sku: product.sku,
    category: product.category ?? "",
    description: product.description ?? "",
    sellingPrice: product.sellingPrice,
    materialCost: product.materialCost,
    productionCost: product.productionCost,
    packagingCost: product.packagingCost,
    otherCost: product.otherCost,
    active: product.active,
    ...calculateProductMetrics(product),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const active = searchParams.get("active");
    const filter: Record<string, unknown> = {};

    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: expression }, { sku: expression }, { description: expression }];
    }

    if (active === "true" || active === "false") {
      filter.active = active === "true";
    }

    const products = await Product.find(filter).sort({ active: -1, name: 1 }).lean();

    return NextResponse.json({ products: products.map(serializeProduct) });
  } catch {
    return NextResponse.json({ error: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = productSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const product = await Product.create(parsed.data);
    await createNotification({ type: "product_created", title: "Product created", message: `${product.name} was added to the catalog.`, entityType: "product", entityId: String(product._id), dedupeKey: `product_created:${product._id}` });

    return NextResponse.json({ product: serializeProduct(product.toObject()) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "A product with this SKU already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create product." }, { status: 500 });
  }
}
