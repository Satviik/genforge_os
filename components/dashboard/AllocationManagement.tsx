"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Plus, RefreshCw, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";

type Person = { id: string; name: string; type: string; phone: string; company: string };
type ProductOption = { id: string; name: string; sku: string; sellingPrice: number };
type AllocationProduct = { productId: string; quantity: number; quantitySold: number; quantityReturned: number; quantityRemaining: number; product?: { name?: string; sku?: string } | null };
type Allocation = { id: string; personId: string; personType: string; person?: Person | null; status: string; products: AllocationProduct[]; moneyGiven: number; moneyReturned: number; totals: { totalUnits: number; soldUnits: number; returnedUnits: number; remainingUnits: number; outstandingAmount: number }; allocatedAt: string };

type DraftProduct = { productId: string; quantity: string };
const selectClass = "h-9 rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-secondary outline-none focus:border-gf-orange/50";
const inputClass = "h-9 rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-text outline-none placeholder:text-gf-muted focus:border-gf-orange/50";

export function AllocationManagement() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [personId, setPersonId] = useState("");
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([{ productId: "", quantity: "1" }]);
  const [moneyGiven, setMoneyGiven] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [allocationResponse, optionsResponse] = await Promise.all([fetch("/api/allocations?period=all", { cache: "no-store" }), fetch("/api/allocations/options", { cache: "no-store" })]);
        const allocationPayload = await allocationResponse.json();
        const optionsPayload = await optionsResponse.json();
        if (!allocationResponse.ok) throw new Error(allocationPayload.error ?? "Unable to load allocations.");
        if (!optionsResponse.ok) throw new Error(optionsPayload.error ?? "Unable to load allocation options.");
        if (!cancelled) { setAllocations(allocationPayload.allocations as Allocation[]); setPeople(optionsPayload.people as Person[]); setProducts(optionsPayload.products as ProductOption[]); }
      } catch (loadError) {
        if (!cancelled) { setAllocations([]); setError(loadError instanceof Error ? loadError.message : "Unable to load allocations."); }
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  function resetForm() { setPersonId(""); setDraftProducts([{ productId: "", quantity: "1" }]); setMoneyGiven("0"); setNotes(""); setFormError(null); }
  function updateProduct(index: number, field: keyof DraftProduct, value: string) { setDraftProducts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)); }
  async function createAllocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const person = people.find((item) => item.id === personId);
    const validProducts = draftProducts.filter((item) => item.productId && Number(item.quantity) > 0);
    if (!person || validProducts.length === 0) { setFormError("Select a person and at least one product."); return; }
    setSaving(true); setFormError(null);
    try {
      const response = await fetch("/api/allocations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId, personType: person.type, products: validProducts.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })), moneyGiven: Number(moneyGiven), notes: notes.trim() || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create allocation.");
      setOpen(false); resetForm(); setRefreshKey((current) => current + 1);
    } catch (saveError) { setFormError(saveError instanceof Error ? saveError.message : "Unable to create allocation."); } finally { setSaving(false); }
  }

  return <div className="space-y-4">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[11px] uppercase tracking-[0.18em] text-gf-muted">External partners</p><h1 className="mt-1 text-xl font-medium text-gf-text">Allocations</h1><p className="mt-1 text-sm text-gf-secondary">Track products held, partner sales, and settlement balances.</p></div><Button size="sm" onClick={() => { resetForm(); setOpen(true); }}><Plus className="size-3.5" />New Allocation</Button></div>
    <Panel padded={false}><PanelHeader title="Allocation ledger" subtitle="Product transfers are separate from orders and expenses." action={<Button variant="ghost" size="icon" aria-label="Refresh allocations" onClick={() => setRefreshKey((current) => current + 1)}><RefreshCw className="size-3.5" /></Button>} />
      {error ? <div className="flex items-center gap-2 p-6 text-sm text-[#ff8b8b]"><AlertCircle className="size-4" />{error}</div> : loading ? <div className="p-6 text-sm text-gf-muted">Loading allocations...</div> : allocations.length === 0 ? <div className="p-8 text-center text-sm text-gf-muted">No allocations recorded.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-[12px]"><thead className="border-b border-gf-border text-[10px] uppercase tracking-[0.14em] text-gf-muted"><tr><th className="px-4 py-3">Person</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Money given</th><th className="px-4 py-3">Outstanding</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-gf-border/70">{allocations.map((allocation) => <tr key={allocation.id} className="text-gf-secondary hover:bg-white/[0.025]"><td className="px-4 py-3"><span className="block font-medium text-gf-text">{allocation.person?.name ?? "Unknown person"}</span><span className="text-[10px] uppercase text-gf-muted">{allocation.personType}</span></td><td className="px-4 py-3 text-gf-text">{allocation.products.length}</td><td className="px-4 py-3">{allocation.totals.totalUnits} given / {allocation.totals.soldUnits} sold / <span className="text-gf-text">{allocation.totals.remainingUnits} remaining</span></td><td className="px-4 py-3 text-gf-text">{formatINR(allocation.moneyGiven)}</td><td className="px-4 py-3 text-gf-orange">{formatINR(allocation.totals.outstandingAmount)}</td><td className="px-4 py-3"><Badge tone={allocation.status === "settled" ? "success" : allocation.status === "cancelled" ? "orange" : "warning"}>{allocation.status.replace("_", " ")}</Badge></td><td className="px-4 py-3">{new Date(allocation.allocatedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
    </Panel>
    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><Panel className="w-full max-w-xl" ><div className="mb-4 flex items-start justify-between"><div><h2 className="text-base font-medium text-gf-text">New allocation</h2><p className="mt-1 text-xs text-gf-muted">Give products or money without creating revenue.</p></div><button type="button" className="text-gf-muted hover:text-gf-text" onClick={() => setOpen(false)} aria-label="Close">×</button></div><form className="space-y-4" onSubmit={createAllocation}><label className="block text-xs text-gf-secondary">Person<select required value={personId} onChange={(event) => setPersonId(event.target.value)} className={`${selectClass} mt-1 w-full`}><option value="">Select external person</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.type}</option>)}</select></label><div><div className="mb-1 text-xs text-gf-secondary">Products</div><div className="space-y-2">{draftProducts.map((item, index) => <div key={index} className="flex gap-2"><select required value={item.productId} onChange={(event) => updateProduct(index, "productId", event.target.value)} className={`${selectClass} min-w-0 flex-1`}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatINR(product.sellingPrice)}</option>)}</select><input required min="1" type="number" value={item.quantity} onChange={(event) => updateProduct(index, "quantity", event.target.value)} className={`${inputClass} w-24`} aria-label="Quantity" /></div>)}</div><button type="button" className="mt-2 text-xs text-gf-orange hover:text-[#ff9a4d]" onClick={() => setDraftProducts((current) => [...current, { productId: "", quantity: "1" }])}>+ Add product</button></div><label className="block text-xs text-gf-secondary">Money given<input min="0" type="number" value={moneyGiven} onChange={(event) => setMoneyGiven(event.target.value)} className={`${inputClass} mt-1 w-full`} /></label><label className="block text-xs text-gf-secondary">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-20 w-full rounded-md border border-gf-border bg-gf-surface p-3 text-xs text-gf-text outline-none focus:border-gf-orange/50" /></label>{formError ? <div className="flex items-center gap-2 text-xs text-[#ff8b8b]"><AlertCircle className="size-3.5" />{formError}</div> : null}<div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" type="submit" disabled={saving}><Wallet className="size-3.5" />{saving ? "Creating..." : "Create allocation"}</Button></div></form></Panel></div> : null}
  </div>;
}
