import { NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import Customer from "@/src/models/Customer";
import Product from "@/src/models/Product";
import TeamMember from "@/src/models/TeamMember";

export async function GET() {
  try {
    await connectToDatabase();
    const [people, products, teamMembers] = await Promise.all([
      Customer.find({ status: "active" }).sort({ name: 1 }).select("name type phone company").lean(),
      Product.find({ active: true }).sort({ name: 1 }).select("name sku sellingPrice").lean(),
      TeamMember.find({ active: true }).sort({ name: 1 }).select("name").lean(),
    ]);
    return NextResponse.json({ people: people.map((person) => ({ id: String(person._id), name: person.name, type: person.type ?? "customer", phone: person.phone ?? "", company: person.company ?? "" })), products: products.map((product) => ({ id: String(product._id), name: product.name, sku: product.sku, sellingPrice: product.sellingPrice })), teamMembers: teamMembers.map((member) => ({ id: String(member._id), name: member.name })) });
  } catch {
    return NextResponse.json({ error: "Unable to load allocation options." }, { status: 500 });
  }
}
