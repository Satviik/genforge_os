"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Eye, Pencil, Plus, RefreshCw, Search, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProductFormDialog, type ProductFormValues } from "@/components/dashboard/ProductFormDialog";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductResponse } from "@/src/lib/product-types";

type StatusFilter = "all" | "active" | "inactive";
type ProfitFilter = "all" | "profitable" | "loss";

function errorMessage(payload: { error?: string }) {
  return payload.error ?? "Something went wrong. Please try again.";
}

export function ProductManagement() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [profitFilter, setProfitFilter] = useState<ProfitFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProductResponse | undefined>();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (status !== "all") params.set("active", String(status === "active"));
        const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(errorMessage(payload));
        if (!cancelled) setProducts(payload.products as ProductResponse[]);
      } catch (loadError) {
        if (!cancelled) {
          setProducts([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();
    return () => { cancelled = true; };
  }, [refreshKey, search, status]);

  const visibleProducts = products.filter((product) => {
    if (profitFilter === "profitable") return product.profitPerUnit >= 0;
    if (profitFilter === "loss") return product.profitPerUnit < 0;
    return true;
  });

  function openAdd() {
    setEditing(undefined);
    setFormError(null);
    setDialog("add");
  }

  function openEdit(product: ProductResponse) {
    setEditing(product);
    setFormError(null);
    setDialog("edit");
  }

  async function saveProduct(values: ProductFormValues) {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    const body = {
      ...values,
      sellingPrice: Number(values.sellingPrice),
      materialCost: Number(values.materialCost),
      productionCost: Number(values.productionCost),
      packagingCost: Number(values.packagingCost),
      otherCost: Number(values.otherCost),
    };

    try {
      const response = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorMessage(payload));
      setDialog(null);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gf-muted">Catalog & margins</p>
          <h1 className="mt-1 text-xl font-medium text-gf-text">Products</h1>
          <p className="mt-1 text-sm text-gf-secondary">Pricing, production costs, and unit economics.</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="size-3.5" />Add Product</Button>
      </div>

      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b border-gf-border p-3 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gf-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or SKUs..." className="h-9 w-full rounded-md border border-gf-border bg-gf-surface pl-9 pr-3 text-[13px] text-gf-text outline-none placeholder:text-gf-muted focus:border-gf-orange/50" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} aria-label="Filter by status" className={selectClass}>
            <option value="all">All statuses</option><option value="active">Active products</option><option value="inactive">Inactive products</option>
          </select>
          <select value={profitFilter} onChange={(event) => setProfitFilter(event.target.value as ProfitFilter)} aria-label="Filter by profitability" className={selectClass}>
            <option value="all">All margins</option><option value="profitable">Profitable</option><option value="loss">At a loss</option>
          </select>
        </div>
        {error ? (
          <div className="flex items-center justify-between gap-3 p-6"><div className="flex items-center gap-2 text-sm text-[#ff8b8b]"><AlertCircle className="size-4" />{error}</div><Button variant="outline" size="sm" onClick={() => setRefreshKey((current) => current + 1)}><RefreshCw className="size-3.5" />Retry</Button></div>
        ) : loading ? <LoadingRows /> : visibleProducts.length === 0 ? <EmptyState hasFilters={Boolean(search || status !== "all" || profitFilter !== "all")} onAdd={openAdd} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead className="border-b border-gf-border text-[10px] uppercase tracking-[0.14em] text-gf-muted"><tr><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Total cost</th><th className="px-4 py-3 font-medium">Profit / unit</th><th className="px-4 py-3 font-medium">Margin</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-gf-border/70">{visibleProducts.map((product) => (
                <tr key={product.id} className="text-gf-secondary transition-colors hover:bg-white/[0.025]">
                  <td className="px-4 py-3"><Link href={`/dashboard/products/${product.id}`} className="flex items-center gap-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-gf-orange/30 bg-[#2a1408] text-[10px] font-semibold text-gf-orange"><UserRound className="size-3.5" /></span><span><span className="block font-medium text-gf-text">{product.name}</span><span className="block font-mono text-[10px] text-gf-muted">{product.sku}</span></span></Link></td>
                  <td className="px-4 py-3 text-gf-text">{formatINR(product.sellingPrice)}</td><td className="px-4 py-3">{formatINR(product.totalCost)}</td><td className={cn("px-4 py-3 font-medium", product.profitPerUnit >= 0 ? "text-gf-success" : "text-[#ff8b8b]")}>{formatINR(product.profitPerUnit)}</td><td className={cn("px-4 py-3", product.profitMargin >= 0 ? "text-gf-success" : "text-[#ff8b8b]")}>{product.profitMargin.toFixed(1)}%</td><td className="px-4 py-3"><Badge tone={product.active ? "success" : "neutral"}>{product.active ? "Active" : "Inactive"}</Badge></td>
                  <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><Link href={`/dashboard/products/${product.id}`} aria-label={`View ${product.name}`} className="rounded-md p-1.5 text-gf-muted hover:bg-white/5 hover:text-gf-text"><Eye className="size-3.5" /></Link><button type="button" aria-label={`Edit ${product.name}`} className="rounded-md p-1.5 text-gf-muted hover:bg-white/5 hover:text-gf-text" onClick={() => openEdit(product)}><Pencil className="size-3.5" /></button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
      {dialog ? <ProductFormDialog mode={dialog} initialProduct={editing} saving={saving} error={formError} onClose={() => { if (!saving) setDialog(null); }} onSave={saveProduct} /> : null}
    </div>
  );
}

function LoadingRows() { return <div className="space-y-3 p-4">{[1, 2, 3, 4].map((row) => <div key={row} className="flex animate-pulse items-center gap-3"><div className="size-7 rounded bg-gf-card-raised" /><div className="h-8 flex-1 rounded bg-gf-card-raised" /><div className="h-8 w-28 rounded bg-gf-card-raised" /></div>)}</div>; }
function EmptyState({ hasFilters, onAdd }: { hasFilters: boolean; onAdd: () => void }) { return <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center"><UserRound className="mb-2 size-6 text-gf-muted" /><p className="text-sm text-gf-secondary">{hasFilters ? "No products match these filters." : "No products yet."}</p>{!hasFilters ? <Button size="sm" className="mt-4" onClick={onAdd}><Plus className="size-3.5" />Add first product</Button> : null}</div>; }

const selectClass = "h-9 rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-secondary outline-none focus:border-gf-orange/50";
