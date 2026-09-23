"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Eye, Pencil, Plus, RefreshCw, Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { OrderFormDialog, type OrderFormValues, type OrderOptions } from "@/components/dashboard/OrderFormDialog";
import { formatINR } from "@/lib/format";
import type { OrderResponse } from "@/src/lib/order-types";
import type { OrderChannel, OrderStatus, PaymentStatus } from "@/src/models/Order";
import { useReportingPeriod } from "@/components/layout/ReportingPeriodContext";

const channelLabels: Record<OrderChannel, string> = { website: "Website", instagram: "Instagram", direct: "Direct", whatsapp: "WhatsApp", marketplace: "Marketplace", other: "Other" };
const statusLabels: Record<OrderStatus, string> = { new: "New", confirmed: "Confirmed", production: "Production", ready: "Ready", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const paymentLabels: Record<PaymentStatus, string> = { pending: "Pending", partial: "Partial", paid: "Paid", refunded: "Refunded" };
function errorMessage(payload: { error?: string }) { return payload.error ?? "Something went wrong. Please try again."; }
function paymentTone(status: PaymentStatus) { return status === "paid" ? "success" : status === "refunded" ? "neutral" : "warning"; }
function orderTone(status: OrderStatus) { return status === "delivered" ? "success" : status === "cancelled" ? "neutral" : "orange"; }

export function OrderManagement() {
  const { range } = useReportingPeriod();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [summary, setSummary] = useState({ totalOrders: 0, revenue: 0, paidOrders: 0, pendingPayments: 0 });
  const [options, setOptions] = useState<OrderOptions>({ customers: [], teamMembers: [], products: [] });
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");
  const [teamMember, setTeamMember] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<OrderResponse | undefined>();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (channel !== "all") params.set("channel", channel);
        if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
        if (orderStatus !== "all") params.set("status", orderStatus);
        if (teamMember !== "all") params.set("teamMember", teamMember);
        if (range.kind === "all") {
          if (from) params.set("from", from);
          if (to) params.set("to", to);
        } else {
          params.set("from", from || range.from);
          params.set("to", to || range.to);
        }
        const [ordersResponse, optionsResponse] = await Promise.all([fetch(`/api/orders?${params.toString()}`, { cache: "no-store" }), fetch("/api/orders/options", { cache: "no-store" })]);
        const ordersPayload = await ordersResponse.json(); const optionsPayload = await optionsResponse.json();
        if (!ordersResponse.ok) throw new Error(errorMessage(ordersPayload));
        if (!optionsResponse.ok) throw new Error(errorMessage(optionsPayload));
        if (!cancelled) { setOrders(ordersPayload.orders as OrderResponse[]); setSummary(ordersPayload.summary); setOptions(optionsPayload as OrderOptions); }
      } catch (loadError) { if (!cancelled) { setOrders([]); setError(loadError instanceof Error ? loadError.message : "Unable to load orders."); } } finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [channel, from, orderStatus, paymentStatus, range, refreshKey, search, teamMember, to]);

  function openAdd() { setEditing(undefined); setFormError(null); setDialog("add"); }
  function openEdit(order: OrderResponse) { setEditing(order); setFormError(null); setDialog("edit"); }
  async function save(values: OrderFormValues) {
    if (saving) return; setSaving(true); setFormError(null);
    const body = { ...values, discount: Number(values.discount), shipping: Number(values.shipping), paidAmount: Number(values.paidAmount), paymentMethod: values.paymentMethod || undefined };
    try { const response = await fetch(editing ? `/api/orders/${editing.id}` : "/api/orders", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json(); if (!response.ok) throw new Error(errorMessage(payload)); setDialog(null); setRefreshKey((current) => current + 1); } catch (saveError) { setFormError(saveError instanceof Error ? saveError.message : "Unable to save order."); } finally { setSaving(false); }
  }

  return <div className="space-y-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[11px] uppercase tracking-[0.18em] text-gf-muted">Revenue pipeline</p><h1 className="mt-1 text-xl font-medium text-gf-text">Orders</h1><p className="mt-1 text-sm text-gf-secondary">Customer orders, payments, and fulfillment progress.</p></div><Button size="sm" onClick={openAdd}><Plus className="size-3.5" />Create Order</Button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Summary label="Total orders" value={String(summary.totalOrders)} /><Summary label="Revenue" value={formatINR(summary.revenue)} /><Summary label="Paid orders" value={String(summary.paidOrders)} tone="success" /><Summary label="Pending payments" value={String(summary.pendingPayments)} tone="warning" /></div><Panel padded={false}><div className="space-y-3 border-b border-gf-border p-3"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gf-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order ID, customer, or phone..." className={inputClass + " pl-9"} /></label><Select value={channel} onChange={setChannel} label="Channel"><option value="all">All channels</option>{Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select value={paymentStatus} onChange={setPaymentStatus} label="Payment"><option value="all">All payments</option><option value="pending">Pending</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="refunded">Refunded</option></Select><Select value={orderStatus} onChange={setOrderStatus} label="Order status"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select value={teamMember} onChange={setTeamMember} label="Team member"><option value="all">All team</option>{options.teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></div><div className="flex flex-wrap items-center gap-2 text-[11px] text-gf-muted"><span>Date range</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={dateClass} aria-label="From date" /><span>to</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={dateClass} aria-label="To date" /></div></div>{error ? <div className="flex items-center justify-between gap-3 p-6"><div className="flex items-center gap-2 text-sm text-[#ff8b8b]"><AlertCircle className="size-4" />{error}</div><Button variant="outline" size="sm" onClick={() => setRefreshKey((current) => current + 1)}><RefreshCw className="size-3.5" />Retry</Button></div> : loading ? <LoadingRows /> : orders.length === 0 ? <EmptyState onAdd={openAdd} /> : <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-[12px]"><thead className="border-b border-gf-border text-[10px] uppercase tracking-[0.14em] text-gf-muted"><tr><th className="px-4 py-3 font-medium">Order ID</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Team member</th><th className="px-4 py-3 font-medium">Channel</th><th className="px-4 py-3 font-medium">Items</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Payment</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-gf-border/70">{orders.map((order) => <tr key={order.id} className="text-gf-secondary transition-colors hover:bg-white/[0.025]"><td className="px-4 py-3"><Link href={`/dashboard/orders/${order.id}`} className="font-mono text-[11px] text-gf-orange hover:underline">{order.orderNumber}</Link></td><td className="px-4 py-3 whitespace-nowrap">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "-"}</td><td className="px-4 py-3"><span className="block text-gf-text">{order.customer.name}</span><span className="text-[11px] text-gf-muted">{order.customer.phone}</span></td><td className="px-4 py-3">{order.teamMember.name}</td><td className="px-4 py-3">{channelLabels[order.channel]}</td><td className="px-4 py-3">{order.items.length}</td><td className="px-4 py-3 font-medium text-gf-text">{formatINR(order.total)}</td><td className="px-4 py-3"><Badge tone={paymentTone(order.paymentStatus)}>{paymentLabels[order.paymentStatus]}</Badge></td><td className="px-4 py-3"><Badge tone={orderTone(order.status)}>{statusLabels[order.status]}</Badge></td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><Link href={`/dashboard/orders/${order.id}`} aria-label={`View ${order.orderNumber}`} className="rounded-md p-1.5 text-gf-muted hover:bg-white/5 hover:text-gf-text"><Eye className="size-3.5" /></Link><button type="button" aria-label={`Edit ${order.orderNumber}`} onClick={() => openEdit(order)} className="rounded-md p-1.5 text-gf-muted hover:bg-white/5 hover:text-gf-text"><Pencil className="size-3.5" /></button></div></td></tr>)}</tbody></table></div>}</Panel>{dialog ? <OrderFormDialog mode={dialog} initialOrder={editing} options={options} saving={saving} error={formError} onClose={() => { if (!saving) setDialog(null); }} onSave={save} /> : null}</div>;
}

function Summary({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) { return <Panel><p className="text-[11px] text-gf-muted">{label}</p><p className={`mt-2 text-xl font-medium ${tone === "success" ? "text-gf-success" : tone === "warning" ? "text-[#f0b45a]" : "text-gf-text"}`}>{value}</p></Panel>; }
function Select({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) { return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>{children}</select>; }
function LoadingRows() { return <div className="space-y-3 p-4">{[1, 2, 3, 4].map((row) => <div key={row} className="flex animate-pulse items-center gap-3"><div className="size-7 rounded bg-gf-card-raised" /><div className="h-8 flex-1 rounded bg-gf-card-raised" /><div className="h-8 w-28 rounded bg-gf-card-raised" /></div>)}</div>; }
function EmptyState({ onAdd }: { onAdd: () => void }) { return <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center"><ShoppingCart className="mb-2 size-6 text-gf-muted" /><p className="text-sm text-gf-secondary">No orders match the current filters.</p><Button size="sm" className="mt-4" onClick={onAdd}><Plus className="size-3.5" />Create first order</Button></div>; }
const inputClass = "h-9 w-full rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-text outline-none placeholder:text-gf-muted focus:border-gf-orange/50";
const selectClass = "h-9 rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-secondary outline-none focus:border-gf-orange/50";
const dateClass = "h-8 rounded-md border border-gf-border bg-gf-surface px-2 text-[11px] text-gf-secondary outline-none focus:border-gf-orange/50";
