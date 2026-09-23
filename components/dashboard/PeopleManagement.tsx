"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Plus, RefreshCw, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";

type Person = { id: string; name: string; type: string; phone: string; company: string; orders: number; revenue: number; productsHeld: number; outstanding: number; joined?: string };
type Summary = { total: number; customers: number; resellers: number; influencers: number; businesses: number };

function ExistingPeopleDirectory() {
  const [people, setPeople] = useState<Person[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => { let cancelled = false; async function load() { setLoading(true); try { const response = await fetch("/api/customers", { cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Unable to load people."); if (!cancelled) { setPeople(payload.people as Person[]); setSummary(payload.summary as Summary); } } catch (loadError) { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load people."); } finally { if (!cancelled) setLoading(false); } } void load(); return () => { cancelled = true; }; }, [refreshKey]);
  return <div className="space-y-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.18em] text-gf-muted">External relationships</p><h1 className="mt-1 text-xl font-medium text-gf-text">People</h1><p className="mt-1 text-sm text-gf-secondary">Customers and external partners stay separate from the internal team.</p></div><Button variant="ghost" size="icon" aria-label="Refresh people" onClick={() => setRefreshKey((current) => current + 1)}><RefreshCw className="size-3.5" /></Button></div>{summary ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Total", summary.total], ["Customers", summary.customers], ["Resellers", summary.resellers], ["Influencers", summary.influencers], ["Businesses", summary.businesses]].map(([label, value]) => <Panel key={String(label)}><p className="text-[10px] uppercase tracking-[0.14em] text-gf-muted">{label}</p><p className="mt-2 text-xl text-gf-text">{value}</p></Panel>)}</div> : null}<Panel padded={false}><PanelHeader title="People directory" subtitle="Orders, held products, and outstanding balances from live records." />{error ? <div className="flex gap-2 p-6 text-sm text-[#ff8b8b]"><AlertCircle className="size-4" />{error}</div> : loading ? <div className="p-6 text-sm text-gf-muted">Loading people...</div> : people.length === 0 ? <div className="p-8 text-center text-sm text-gf-muted">No people recorded.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-[12px]"><thead className="border-b border-gf-border text-[10px] uppercase tracking-[0.14em] text-gf-muted"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">Held</th><th className="px-4 py-3">Outstanding</th></tr></thead><tbody className="divide-y divide-gf-border/70">{people.map((person) => <tr key={person.id} className="text-gf-secondary hover:bg-white/[0.025]"><td className="px-4 py-3"><Link href={`/dashboard/people/${person.id}`} className="flex items-center gap-2 text-gf-text hover:text-gf-orange"><span className="flex size-7 items-center justify-center rounded-md border border-gf-orange/30 bg-[#2a1408] text-gf-orange"><Users className="size-3.5" /></span>{person.name}</Link></td><td className="px-4 py-3"><Badge tone={person.type === "reseller" || person.type === "partner" ? "orange" : "neutral"}>{person.type}</Badge></td><td className="px-4 py-3">{person.phone || "-"}</td><td className="px-4 py-3">{person.orders}</td><td className="px-4 py-3 text-gf-text">{formatINR(person.revenue)}</td><td className="px-4 py-3">{person.productsHeld}</td><td className="px-4 py-3 text-gf-orange">{formatINR(person.outstanding)}</td></tr>)}</tbody></table></div>}</Panel></div>;
}

type PersonForm = { name: string; type: string; phone: string; email: string; notes: string };
const emptyPersonForm: PersonForm = { name: "", type: "customer", phone: "", email: "", notes: "" };
const personInputClass = "h-9 w-full rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-text outline-none placeholder:text-gf-muted focus:border-gf-orange/50";

function AddPersonDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PersonForm>(emptyPersonForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(field: keyof PersonForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, phone: form.phone || undefined, email: form.email || undefined, notes: form.notes || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create person.");
      setOpen(false);
      setForm(emptyPersonForm);
      onCreated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create person.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <Button size="sm" onClick={() => { setError(null); setOpen(true); }}><Plus className="size-3.5" />Add Person</Button>
    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-[10px] border border-gf-border bg-gf-card p-4 shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-sm font-medium text-gf-text">Add Person</h2><p className="mt-0.5 text-[11px] text-gf-muted">Create an external customer or partner.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-gf-muted hover:bg-white/5 hover:text-gf-text" aria-label="Close dialog"><X className="size-4" /></button></div><form className="space-y-3" onSubmit={submit}><label className="block text-[11px] text-gf-secondary">Name *<input required autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} className={`${personInputClass} mt-1`} /></label><label className="block text-[11px] text-gf-secondary">Type *<select required value={form.type} onChange={(event) => update("type", event.target.value)} className={`${personInputClass} mt-1`}><option value="customer">Customer</option><option value="reseller">Reseller</option><option value="influencer">Influencer</option><option value="business">Business</option><option value="distributor">Distributor</option><option value="partner">Other Partner</option></select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-[11px] text-gf-secondary">Phone<input value={form.phone} onChange={(event) => update("phone", event.target.value)} className={`${personInputClass} mt-1`} /></label><label className="block text-[11px] text-gf-secondary">Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={`${personInputClass} mt-1`} /></label></div><label className="block text-[11px] text-gf-secondary">Notes<textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} className="mt-1 min-h-20 w-full rounded-md border border-gf-border bg-gf-surface p-3 text-[12px] text-gf-text outline-none focus:border-gf-orange/50" /></label>{error ? <div className="flex items-center gap-2 text-xs text-[#ff8b8b]"><AlertCircle className="size-3.5" />{error}</div> : null}<div className="flex justify-end gap-2 pt-1"><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Person"}</Button></div></form></div></div> : null}
  </>;
}

export function PeopleManagement() {
  const [directoryKey, setDirectoryKey] = useState(0);
  return <div className="space-y-2"><div className="flex justify-end"><AddPersonDialog onCreated={() => setDirectoryKey((current) => current + 1)} /></div><ExistingPeopleDirectory key={directoryKey} /></div>;
}
