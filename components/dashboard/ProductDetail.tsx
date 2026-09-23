"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Edit3, Loader2, RefreshCw, XCircle } from "lucide-react";
import { ProductFormDialog, type ProductFormValues } from "@/components/dashboard/ProductFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";
import type { ProductResponse } from "@/src/lib/product-types";

function errorMessage(payload: { error?: string }) { return payload.error ?? "Something went wrong. Please try again."; }

export function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(errorMessage(payload));
        if (!cancelled) setProduct(payload.product as ProductResponse);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProduct();
    return () => { cancelled = true; };
  }, [productId, refreshKey]);

  async function saveProduct(values: ProductFormValues) {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/products/${productId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, sellingPrice: Number(values.sellingPrice), materialCost: Number(values.materialCost), productionCost: Number(values.productionCost), packagingCost: Number(values.packagingCost), otherCost: Number(values.otherCost) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorMessage(payload));
      setEditing(false);
      setRefreshKey((current) => current + 1);
    } catch (saveError) { setFormError(saveError instanceof Error ? saveError.message : "Unable to save product."); } finally { setSaving(false); }
  }

  async function setActive(active: boolean) {
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorMessage(payload));
      setRefreshKey((current) => current + 1);
    } catch (statusError) { setError(statusError instanceof Error ? statusError.message : "Unable to update product status."); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center text-gf-muted"><Loader2 className="size-5 animate-spin" /></div>;
  if (error || !product) return <div className="space-y-4"><Link href="/dashboard/products" className="inline-flex items-center gap-1.5 text-xs text-gf-secondary hover:text-gf-text"><ArrowLeft className="size-3.5" />Back to products</Link><Panel><div className="flex items-center gap-2 text-sm text-[#ff8b8b]"><AlertCircle className="size-4" />{error ?? "Product not found."}</div><Button variant="outline" size="sm" className="mt-4" onClick={() => setRefreshKey((current) => current + 1)}><RefreshCw className="size-3.5" />Retry</Button></Panel></div>;

  return (
    <div className="space-y-4">
      <Link href="/dashboard/products" className="inline-flex items-center gap-1.5 text-xs text-gf-secondary hover:text-gf-text"><ArrowLeft className="size-3.5" />Back to products</Link>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[11px] text-gf-muted">{product.sku}</p><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-medium text-gf-text">{product.name}</h1><Badge tone={product.active ? "success" : "neutral"}>{product.active ? "Active" : "Inactive"}</Badge></div><p className="mt-1 text-sm text-gf-secondary">{product.description || "No product description."}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setFormError(null); setEditing(true); }}><Edit3 className="size-3.5" />Edit product</Button>{product.active ? <Button variant="outline" size="sm" disabled={saving} onClick={() => setActive(false)}><XCircle className="size-3.5" />Deactivate</Button> : <Button size="sm" disabled={saving} onClick={() => setActive(true)}><CheckCircle2 className="size-3.5" />Reactivate</Button>}</div></div>
      {error ? <p className="flex items-center gap-2 text-xs text-[#ff8b8b]"><AlertCircle className="size-3.5" />{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3"><Metric label="Selling price" value={formatINR(product.sellingPrice)} /><Metric label="Profit per unit" value={formatINR(product.profitPerUnit)} tone={product.profitPerUnit >= 0 ? "success" : "danger"} /><Metric label="Profit margin" value={`${product.profitMargin.toFixed(1)}%`} tone={product.profitMargin >= 0 ? "success" : "danger"} /></div>
      <Panel><PanelHeader title="Cost breakdown" subtitle="Calculated from the current product inputs" /><div className="space-y-2">{[["Material cost", product.materialCost], ["Production cost", product.productionCost], ["Packaging cost", product.packagingCost], ["Other cost", product.otherCost]].map(([label, amount]) => <div key={label as string} className="flex items-center justify-between border-b border-gf-border/70 py-2 text-[12px]"><span className="text-gf-secondary">{label as string}</span><span className="text-gf-text">{formatINR(amount as number)}</span></div>)}<div className="flex items-center justify-between pt-2 text-sm font-medium"><span className="text-gf-text">Total cost</span><span className="text-gf-orange">{formatINR(product.totalCost)}</span></div></div></Panel>
      <Panel><PanelHeader title="Product record" /><div className="grid gap-3 text-[12px] sm:grid-cols-2"><Info label="SKU" value={product.sku} /><Info label="Status" value={product.active ? "Active" : "Inactive"} /><Info label="Selling price" value={formatINR(product.sellingPrice)} /><Info label="Profit margin" value={`${product.profitMargin.toFixed(1)}%`} /></div></Panel>
      {editing ? <ProductFormDialog mode="edit" initialProduct={product} saving={saving} error={formError} onClose={() => { if (!saving) setEditing(false); }} onSave={saveProduct} /> : null}
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) { return <Panel><p className="text-[11px] text-gf-muted">{label}</p><p className={`mt-2 text-xl font-medium ${tone === "success" ? "text-gf-success" : tone === "danger" ? "text-[#ff8b8b]" : "text-gf-text"}`}>{value}</p></Panel>; }
function Info({ label, value }: { label: string; value: string }) { return <p><span className="text-gf-muted">{label}</span><br /><span className="mt-1 inline-block text-gf-text">{value}</span></p>; }
