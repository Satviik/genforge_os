import AllocationEvent, { type IAllocationEvent } from "@/src/models/AllocationEvent";
import type { IAllocation } from "@/src/models/Allocation";

type PopulatedReference = { _id: unknown; name?: string; sku?: string };
export type AllocationEventRecord = IAllocationEvent & { _id: unknown; product?: PopulatedReference | unknown; customer?: PopulatedReference | unknown; order?: unknown; createdAt?: Date };

function idOf(value: unknown) {
  return value && typeof value === "object" && "_id" in value ? String(value._id) : String(value ?? "");
}

export async function getAllocationEvents(allocationId: string) {
  return AllocationEvent.find({ allocation: allocationId }).populate("product", "name sku").populate("customer", "name phone").sort({ date: -1, createdAt: -1 }).lean() as unknown as Promise<AllocationEventRecord[]>;
}

export function summarizeAllocation(allocation: IAllocation, events: AllocationEventRecord[]) {
  const products = allocation.products.map((item) => {
    const productEvents = events.filter((event) => idOf(event.product) === idOf(item.productId));
    const sold = productEvents.filter((event) => event.type === "sale").reduce((sum, event) => sum + (event.quantity ?? 0), 0);
    const returned = productEvents.filter((event) => event.type === "return").reduce((sum, event) => sum + (event.quantity ?? 0), 0);
    return { productId: idOf(item.productId), quantity: item.quantity, unitValue: item.unitValue, totalValue: item.totalValue, quantitySold: sold, quantityReturned: returned, quantityRemaining: item.quantity - sold - returned };
  });
  const moneyGiven = allocation.moneyGiven;
  const moneyReturned = events.filter((event) => event.type === "payment").reduce((sum, event) => sum + (event.amount ?? 0), 0);
  return { products, moneyGiven, moneyReturned, outstandingAmount: Math.max(0, moneyGiven - moneyReturned), totals: { totalUnits: products.reduce((sum, item) => sum + item.quantity, 0), soldUnits: products.reduce((sum, item) => sum + item.quantitySold, 0), returnedUnits: products.reduce((sum, item) => sum + item.quantityReturned, 0), remainingUnits: products.reduce((sum, item) => sum + item.quantityRemaining, 0), outstandingAmount: Math.max(0, moneyGiven - moneyReturned) } };
}

export function serializeAllocationActivity(allocation: IAllocation & { _id: unknown; personId?: unknown; status: string; notes?: string; allocatedAt: Date; createdAt?: Date; updatedAt?: Date }, events: AllocationEventRecord[]) {
  const summary = summarizeAllocation(allocation, events);
  const products = summary.products.map((item) => {
    const source = allocation.products.find((candidate) => idOf(candidate.productId) === item.productId);
    const populated = source && typeof source.productId === "object" ? source.productId : null;
    return { ...item, product: populated };
  });
  const activity = events.map((event) => ({ id: String(event._id), type: event.type, date: event.date, product: event.product && typeof event.product === "object" ? event.product : null, quantity: event.quantity ?? 0, unitPrice: event.unitPrice ?? 0, amount: event.amount ?? 0, channel: event.channel ?? "", paymentMethod: event.paymentMethod ?? "", reference: event.reference ?? "", reason: event.reason ?? "", notes: event.notes ?? "", orderId: event.order ? String(event.order) : null }));
  return { id: String(allocation._id), personId: idOf(allocation.personId), person: allocation.personId && typeof allocation.personId === "object" ? allocation.personId : null, personType: allocation.personType, status: allocation.status, notes: allocation.notes ?? "", allocatedAt: allocation.allocatedAt, createdAt: allocation.createdAt, updatedAt: allocation.updatedAt, products, moneyGiven: summary.moneyGiven, moneyReturned: summary.moneyReturned, outstandingAmount: summary.outstandingAmount, totals: summary.totals, activity };
}
