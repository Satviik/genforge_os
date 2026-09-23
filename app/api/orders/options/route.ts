import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import Customer from "@/src/models/Customer";
import Product from "@/src/models/Product";
import TeamMember from "@/src/models/TeamMember";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const [customers, teamMembers, products] = await Promise.all([
      Customer.find({ status: "active" }).sort({ name: 1 }).lean(),
      TeamMember.find({ active: true }).sort({ name: 1 }).lean(),
      Product.find({ active: true }).sort({ name: 1 }).lean(),
    ]);

    return NextResponse.json({
      customers: customers.map((customer) => ({ id: String(customer._id), name: customer.name, phone: customer.phone ?? "" })),
      teamMembers: teamMembers.map((member) => ({ id: String(member._id), name: member.name })),
      products: products.map((product) => ({ id: String(product._id), name: product.name, sku: product.sku, sellingPrice: product.sellingPrice })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load order options." }, { status: 500 });
  }
}
