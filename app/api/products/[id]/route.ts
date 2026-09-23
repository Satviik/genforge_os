import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/src/lib/mongodb";
import { calculateProductMetrics } from "@/src/lib/product-calculations";
import { productSchema, productUpdateSchema } from "@/src/lib/validations/product";
import Product from "@/src/models/Product";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type ProductRecord = {
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
};

function serializeProduct(product: ProductRecord) {
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

async function getId(context: RouteContext) {
  const { id } = await context.params;
  return Types.ObjectId.isValid(id) ? id : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const id = await getId(context);
  if (!id) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });

  try {
    await connectToDatabase();
    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch {
    return NextResponse.json({ error: "Unable to load product." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const id = await getId(context);
  if (!id) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });

  try {
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "A product with this SKU already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to update product." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await getId(context);
  if (!id) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });

  try {
    const parsed = productUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch {
    return NextResponse.json({ error: "Unable to update product." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = await getId(context);
  if (!id) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });

  try {
    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(id, { active: false }, {
      new: true,
      runValidators: true,
    }).lean();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch {
    return NextResponse.json({ error: "Unable to deactivate product." }, { status: 500 });
  }
}
