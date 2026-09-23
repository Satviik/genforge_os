import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import Material from "@/src/models/Material";
import Order from "@/src/models/Order";
import Product from "@/src/models/Product";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const [orders, products, materials] = await Promise.all([
      Order.find({ status: { $ne: "cancelled" } }).populate("customer", "name").sort({ createdAt: -1 }).lean(),
      Product.find({ active: true }).sort({ name: 1 }).lean(),
      Material.find({ active: true }).sort({ name: 1 }).lean(),
    ]);
    return NextResponse.json({
      orders: orders.map((order) => ({ id: String(order._id), orderNumber: order.orderNumber, customerName: order.customer && typeof order.customer === "object" && "name" in order.customer ? String(order.customer.name) : "Unknown customer", items: order.items.map((item) => ({ productId: String(item.product), name: item.productName, sku: item.sku, quantity: item.quantity })) })),
      products: products.map((product) => ({ id: String(product._id), name: product.name, sku: product.sku })),
      materials: materials.map((material) => ({ id: String(material._id), name: material.name, unit: material.unit })),
    });
  } catch { return NextResponse.json({ error: "Unable to load production options." }, { status: 500 }); }
}
