"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CreditCard, Plus, RefreshCw, RotateCcw, ShoppingBag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";

type Person = { id: string; name: string; type: string };
type Product = { id: string; name: string; sku: string; sellingPrice: number };
type TeamMember = { id: string; name: string };
type AllocationProduct = { productId: string; quantity: number; quantitySold: number; quantityReturned: number; quantityRemaining: number; product?: { name?: string; sku?: string } | null };
type Activity = { id: string; type: string; date: string; product?: { name?: string } | null; quantity: number; unitPrice: number; amount: number; paymentMethod: string; reference: string };
type Allocation = { id: string; personType: string; person?: Person | null; status: string; notes: string; products: AllocationProduct[]; moneyGiven: number; moneyReturned: number; outstandingAmount: number; totals: { totalUnits: number; soldUnits: number; returnedUnits: number; remainingUnits: number; outstandingAmount: number }; allocatedAt: string; activity?: Activity[] };
type Action = "sale" | "return" | "payment";

const inputClass = "h-9 w-full rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-text outline-none focus:border-gf-orange/50";
const selectClass = "h-9 w-full rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-secondary outline-none focus:border-gf-orange/50";
const today = () => new Date().toISOString().slice(0, 10);

export function AllocationWorkspace() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<Allocation | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [allocationResponse, optionsResponse] = await Promise.all([
          fetch("/api/allocations?period=all", { cache: "no-store" }),
          fetch("/api/allocations/options", { cache: "no-store" }),
        ]);
        const allocationPayload = await allocationResponse.json();
        const optionsPayload = await optionsResponse.json();
        if (!allocationResponse.ok) throw new Error(allocationPayload.error ?? "Unable to load allocations.");
        if (!optionsResponse.ok) throw new Error(optionsPayload.error ?? "Unable to load allocation options.");
        if (!cancelled) {
          setAllocations(allocationPayload.allocations as Allocation[]);
          setPeople(optionsPayload.people as Person[]);
          setProducts(optionsPayload.products as Product[]);
          setTeamMembers(optionsPayload.teamMembers as TeamMember[]);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load allocations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function selectAllocation(allocation: Allocation) {
    setSelected(allocation);
    const response = await fetch(`/api/allocations/${allocation.id}`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setSelected(payload.allocation as Allocation);
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !action) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload: Record<string, string | number> = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== "").map(([key, value]) => [key, String(value)]));
    for (const key of ["quantity", "unitPrice", "amount", "paidAmount"]) if (key in payload) payload[key] = Number(payload[key]);
    const endpoint = action === "sale" ? "sales" : action === "return" ? "returns" : "payments";
    setSaving(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/allocations/${selected.id}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to record transaction.");
      setAction(null);
      await selectAllocation(selected);
      setRefreshKey((current) => current + 1);
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Unable to record transaction.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-4">
    <Header onRefresh={() => setRefreshKey((current) => current + 1)} onNew={() => setCreateOpen(true)} />
    <Panel padded={false}>
      <PanelHeader title="Allocation ledger" subtitle="Click an allocation to inspect transactions and record activity." />
      {error ? <div className="flex gap-2 p-6 text-sm text-[#ff8b8b]"><AlertCircle className="size-4" />{error}</div> : loading ? <p className="p-6 text-sm text-gf-muted">Loading allocations...</p> : allocations.length === 0 ? <p className="p-8 text-center text-sm text-gf-muted">No allocations recorded.</p> : <AllocationTable allocations={allocations} onSelect={(allocation) => void selectAllocation(allocation)} />}
    </Panel>
    {createOpen ? <CreateDialog people={people} products={products} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); setRefreshKey((current) => current + 1); }} /> : null}
    {selected ? <Detail allocation={selected} onClose={() => { setSelected(null); setAction(null); }} onAction={(nextAction) => { setActionError(null); setAction(nextAction); }} /> : null}
    {selected && action ? <ActionDialog action={action} allocation={selected} products={products} people={people} teamMembers={teamMembers} saving={saving} error={actionError} onClose={() => setAction(null)} onSubmit={submitAction} /> : null}
  </div>;
}

function Header({ onRefresh, onNew }: { onRefresh: () => void; onNew: () => void }) { return <div className="flex items-end justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.18em] text-gf-muted">External partners</p><h1 className="mt-1 text-xl font-medium text-gf-text">Allocations</h1><p className="mt-1 text-sm text-gf-secondary">Track products held, partner sales, and settlement balances.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={onNew}><Plus className="size-3.5" />New Allocation</Button><Button variant="ghost" size="icon" aria-label="Refresh allocations" onClick={onRefresh}><RefreshCw className="size-3.5" /></Button></div></div>; }
function AllocationTable({ allocations, onSelect }: { allocations: Allocation[]; onSelect: (allocation: Allocation) => void }) { return <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-[12px]"><thead className="border-b border-gf-border text-[10px] uppercase tracking-[0.14em] text-gf-muted"><tr><th className="px-4 py-3">Person</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Money given</th><th className="px-4 py-3">Outstanding</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-gf-border/70">{allocations.map((allocation) => <tr key={allocation.id} tabIndex={0} onClick={() => onSelect(allocation)} onKeyDown={(event) => { if (event.key === "Enter") onSelect(allocation); }} className="cursor-pointer text-gf-secondary hover:bg-white/[0.025]"><td className="px-4 py-3"><span className="block font-medium text-gf-text">{allocation.person?.name ?? "Unknown person"}</span><span className="text-[10px] uppercase text-gf-muted">{allocation.personType}</span></td><td className="px-4 py-3 text-gf-text">{allocation.products.length}</td><td className="px-4 py-3">{allocation.totals.totalUnits} given / {allocation.totals.soldUnits} sold / <span className="text-gf-text">{allocation.totals.remainingUnits} remaining</span></td><td className="px-4 py-3 text-gf-text">{formatINR(allocation.moneyGiven)}</td><td className="px-4 py-3 text-gf-orange">{formatINR(allocation.totals.outstandingAmount)}</td><td className="px-4 py-3"><Badge tone={allocation.status === "settled" ? "success" : "warning"}>{allocation.status.replace("_", " ")}</Badge></td><td className="px-4 py-3">{new Date(allocation.allocatedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>; }

function Detail({ allocation, onClose, onAction }: { allocation: Allocation; onClose: () => void; onAction: (action: Action) => void }) { const initialActivity: Activity = { id: `allocation-${allocation.id}`, type: "allocation", date: allocation.allocatedAt, quantity: allocation.totals.totalUnits, amount: allocation.moneyGiven, unitPrice: 0, product: null, paymentMethod: "", reference: "" }; const activity = [initialActivity, ...(allocation.activity ?? [])].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()); return <Modal title="Allocation detail" onClose={onClose}><div className="space-y-4"><div className="grid gap-3 text-xs text-gf-secondary sm:grid-cols-3"><div>Person<p className="text-gf-text">{allocation.person?.name ?? "Unknown"}</p></div><div>Type<p className="text-gf-text">{allocation.personType}</p></div><div>Date<p className="text-gf-text">{new Date(allocation.allocatedAt).toLocaleDateString()}</p></div></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => onAction("sale")}><ShoppingBag className="size-3.5" />Record Sale</Button><Button variant="outline" size="sm" onClick={() => onAction("return")}><RotateCcw className="size-3.5" />Record Return</Button><Button variant="outline" size="sm" onClick={() => onAction("payment")}><CreditCard className="size-3.5" />Record Payment</Button></div><Panel padded={false}><PanelHeader title="Products" subtitle="Remaining is calculated from recorded sale and return events." /><table className="w-full text-left text-xs"><thead className="border-b border-gf-border text-[10px] uppercase text-gf-muted"><tr><th className="px-3 py-2">Product</th><th className="px-3 py-2">Given</th><th className="px-3 py-2">Sold</th><th className="px-3 py-2">Returned</th><th className="px-3 py-2">Remaining</th></tr></thead><tbody className="divide-y divide-gf-border/70">{allocation.products.map((item) => <tr key={item.productId}><td className="px-3 py-2 text-gf-text">{item.product?.name ?? "Product"}</td><td className="px-3 py-2">{item.quantity}</td><td className="px-3 py-2">{item.quantitySold}</td><td className="px-3 py-2">{item.quantityReturned}</td><td className="px-3 py-2 text-gf-orange">{item.quantityRemaining}</td></tr>)}</tbody></table></Panel><Panel><PanelHeader title="Money" /><div className="flex flex-wrap gap-5 text-xs text-gf-secondary"><span>Given <strong className="text-gf-text">{formatINR(allocation.moneyGiven)}</strong></span><span>Returned <strong className="text-gf-text">{formatINR(allocation.moneyReturned)}</strong></span><span>Outstanding <strong className="text-gf-orange">{formatINR(allocation.outstandingAmount)}</strong></span></div></Panel><Panel padded={false}><PanelHeader title="Activity history" subtitle="Newest activity first." /><div className="divide-y divide-gf-border/70">{activity.map((item) => <div key={item.id} className="flex justify-between gap-3 px-3 py-3 text-xs"><div><p className="uppercase text-gf-orange">{item.type}</p><p className="text-gf-secondary">{item.type === "allocation" ? `${item.quantity} units allocated` : item.type === "payment" ? "Payment received" : `${item.product?.name ?? "Product"} × ${item.quantity}`}</p></div><div className="text-right text-gf-secondary"><p className="text-gf-text">{item.type === "sale" ? formatINR(item.quantity * item.unitPrice) : item.type === "payment" || item.type === "allocation" ? formatINR(item.amount) : ""}</p><p>{new Date(item.date).toLocaleDateString()}</p></div></div>)}</div></Panel>{allocation.notes ? <p className="text-xs text-gf-muted">Notes: {allocation.notes}</p> : null}</div></Modal>; }

function ActionDialog({ action, allocation, products, people, teamMembers, saving, error, onClose, onSubmit }: { action: Action; allocation: Allocation; products: Product[]; people: Person[]; teamMembers: TeamMember[]; saving: boolean; error: string | null; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { const available = allocation.products.filter((item) => item.quantityRemaining > 0); return <Modal title={action === "sale" ? "Record Sale" : action === "return" ? "Record Return" : "Record Payment"} onClose={onClose}><form className="space-y-3" onSubmit={onSubmit}>{action === "payment" ? <><Field label="Amount"><input required min="0.01" step="0.01" name="amount" type="number" className={inputClass} /></Field><Field label="Payment date"><input name="paymentDate" type="date" defaultValue={today()} className={inputClass} /></Field><Field label="Payment method"><select required name="paymentMethod" className={selectClass}><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select></Field><Field label="Reference"><input name="reference" className={inputClass} /></Field></> : <><Field label="Product"><select required name="productId" className={selectClass}>{available.map((item) => <option key={item.productId} value={item.productId}>{item.product?.name ?? products.find((product) => product.id === item.productId)?.name ?? "Product"} · {item.quantityRemaining} remaining</option>)}</select></Field><Field label={action === "sale" ? "Quantity sold" : "Quantity returned"}><input required min="1" name="quantity" type="number" className={inputClass} /></Field>{action === "sale" ? <><Field label="Selling price per unit"><input required min="0" step="0.01" name="unitPrice" defaultValue={products.find((product) => product.id === available[0]?.productId)?.sellingPrice ?? 0} type="number" className={inputClass} /></Field><Field label="Sale date"><input name="saleDate" type="date" defaultValue={today()} className={inputClass} /></Field><Field label="Sales channel"><select required name="channel" className={selectClass}><option value="direct">Direct</option><option value="website">Website</option><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="marketplace">Marketplace</option><option value="other">Other</option></select></Field><Field label="Customer (optional)"><select name="customerId" className={selectClass}><option value="">No customer linked</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></Field><Field label="Team member (required to create Order)"><select name="teamMemberId" className={selectClass}><option value="">No Order created</option>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></Field></> : <><Field label="Return date"><input name="returnDate" type="date" defaultValue={today()} className={inputClass} /></Field><Field label="Reason"><input name="reason" className={inputClass} /></Field></>}</>}{error ? <p className="flex items-center gap-2 text-xs text-[#ff8b8b]"><AlertCircle className="size-3.5" />{error}</p> : null}<div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div></form></Modal>; }
function CreateDialog({ people, products, onClose, onCreated }: { people: Person[]; products: Product[]; onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/allocations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: values.personId, personType: people.find((person) => person.id === values.personId)?.type, products: [{ productId: values.productId, quantity: Number(values.quantity) }], moneyGiven: Number(values.moneyGiven ?? 0), notes: values.notes || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create allocation.");
      onCreated();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to create allocation."); } finally { setSaving(false); }
  }
  return <Modal title="New allocation" onClose={onClose}><form className="space-y-3" onSubmit={submit}><Field label="Person"><select required name="personId" className={selectClass}><option value="">Select external person</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.type}</option>)}</select></Field><Field label="Product"><select required name="productId" className={selectClass}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatINR(product.sellingPrice)}</option>)}</select></Field><Field label="Quantity"><input required min="1" name="quantity" type="number" className={inputClass} /></Field><Field label="Money given"><input min="0" defaultValue="0" name="moneyGiven" type="number" className={inputClass} /></Field><Field label="Notes"><textarea name="notes" className="min-h-16 w-full rounded-md border border-gf-border bg-gf-surface p-2 text-xs text-gf-text" /></Field>{error ? <p className="text-xs text-[#ff8b8b]">{error}</p> : null}<div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Create allocation"}</Button></div></form></Modal>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1 text-xs text-gf-secondary">{label}{children}</label>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[10px] border border-gf-border bg-gf-card p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium text-gf-text">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="text-gf-muted hover:text-gf-text"><X className="size-4" /></button></div>{children}</div></div>; }
