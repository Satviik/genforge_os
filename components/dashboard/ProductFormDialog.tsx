"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/src/lib/product-types";

export type ProductFormValues = {
  name: string;
  sku: string;
  description: string;
  sellingPrice: string;
  materialCost: string;
  productionCost: string;
  packagingCost: string;
  otherCost: string;
  active: boolean;
};

export function productToForm(product?: ProductResponse): ProductFormValues {
  return product
    ? {
        name: product.name,
        sku: product.sku,
        description: product.description,
        sellingPrice: String(product.sellingPrice),
        materialCost: String(product.materialCost),
        productionCost: String(product.productionCost),
        packagingCost: String(product.packagingCost),
        otherCost: String(product.otherCost),
        active: product.active,
      }
    : {
        name: "",
        sku: "",
        description: "",
        sellingPrice: "",
        materialCost: "",
        productionCost: "",
        packagingCost: "",
        otherCost: "",
        active: true,
      };
}

export function ProductFormDialog({
  mode,
  initialProduct,
  saving,
  error,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  initialProduct?: ProductResponse;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (values: ProductFormValues) => void;
}) {
  const [form, setForm] = useState<ProductFormValues>(() => productToForm(initialProduct));

  function update(field: keyof ProductFormValues, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="my-6 w-full max-w-2xl rounded-[10px] border border-gf-border bg-gf-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-gf-border px-4 py-3">
          <div>
            <h2 id="product-dialog-title" className="text-sm font-medium text-gf-text">
              {mode === "add" ? "Add product" : "Edit product"}
            </h2>
            <p className="mt-0.5 text-[11px] text-gf-muted">Product pricing and cost inputs</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-gf-muted hover:bg-white/5 hover:text-gf-text" aria-label="Close dialog">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required>
              <input required value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClass} autoFocus />
            </Field>
            <Field label="SKU" required>
              <input required value={form.sku} onChange={(event) => update("sku", event.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} value={form.description} onChange={(event) => update("description", event.target.value)} className={`${inputClass} h-auto py-2`} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AmountField label="Selling price" value={form.sellingPrice} onChange={(value) => update("sellingPrice", value)} required />
            <AmountField label="Material cost" value={form.materialCost} onChange={(value) => update("materialCost", value)} required />
            <AmountField label="Production cost" value={form.productionCost} onChange={(value) => update("productionCost", value)} required />
            <AmountField label="Packaging cost" value={form.packagingCost} onChange={(value) => update("packagingCost", value)} required />
            <AmountField label="Other cost" value={form.otherCost} onChange={(value) => update("otherCost", value)} required />
          </div>
          {mode === "edit" ? (
            <label className="flex items-center gap-2 text-xs text-gf-secondary">
              <input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} className="accent-gf-orange" />
              Active product
            </label>
          ) : null}
          {error ? <p className="flex items-center gap-2 text-xs text-[#ff8b8b]"><AlertCircle className="size-3.5" />{error}</p> : null}
          <div className="flex justify-end gap-2 border-t border-gf-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              {mode === "add" ? "Add product" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-[11px] font-medium text-gf-secondary">{label}{required ? " *" : ""}</span>{children}</label>;
}

function AmountField({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <Field label={label} required={required}>
      <input required={required} type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </Field>
  );
}

const inputClass = "h-9 w-full rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-text outline-none placeholder:text-gf-muted focus:border-gf-orange/50";
