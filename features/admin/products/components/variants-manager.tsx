"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addVariantAction,
  deleteVariantAction,
  updateVariantAction,
  type ActionResult,
} from "../actions";

type Option = { id: string; name: string };

export type VariantRowData = {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  priceOverride: number | null;
};

type VariantsManagerProps = {
  productId: string;
  variants: VariantRowData[];
  sizes: Option[];
  colors: Option[];
};

const LOW_STOCK = 5;

function overrideToString(v: number | null) {
  return v === null ? "" : String(v);
}

function VariantRow({
  variant,
  disabled,
  onSave,
  onAskDelete,
}: {
  variant: VariantRowData;
  disabled: boolean;
  onSave: (id: string, stock: number, priceOverride: string) => void;
  onAskDelete: (variant: VariantRowData) => void;
}) {
  const [stock, setStock] = useState(String(variant.stock));
  const [override, setOverride] = useState(overrideToString(variant.priceOverride));

  const changed =
    stock !== String(variant.stock) ||
    override !== overrideToString(variant.priceOverride);

  const stockStyle =
    variant.stock === 0
      ? "text-red-700"
      : variant.stock <= LOW_STOCK
        ? "text-amber-700"
        : "text-neutral-900";

  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="px-3 py-2">{variant.size}</td>
      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full border border-neutral-300"
            style={{ backgroundColor: variant.colorHex }}
            aria-hidden="true"
          />
          {variant.color}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-neutral-500">{variant.sku}</td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          aria-label={`Stock for ${variant.size} ${variant.color}`}
          className={`w-24 ${stockStyle}`}
        />
      </td>
      <td className="px-3 py-2">
        <Input
          inputMode="decimal"
          placeholder="—"
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          aria-label={`Price override for ${variant.size} ${variant.color}`}
          className="w-24"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!changed || disabled}
            onClick={() => onSave(variant.id, Number(stock), override)}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onAskDelete(variant)}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function VariantsManager({
  productId,
  variants,
  sizes,
  colors,
}: VariantsManagerProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VariantRowData | null>(null);

  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newOverride, setNewOverride] = useState("");

  function run(fn: () => Promise<ActionResult>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
      else onOk?.();
    });
  }

  function handleAdd() {
    run(
      () =>
        addVariantAction(productId, {
          sizeId,
          colorId,
          stock: Number(newStock),
          priceOverride: newOverride,
        }),
      () => {
        setNewStock("0");
        setNewOverride("");
      },
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase">
        Sizes, colors and stock
      </h2>

      {variants.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No variants yet. The product shows as sold out in the store until you
          add at least one with stock above zero.
        </p>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Color</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Price override</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <VariantRow
                  key={v.id}
                  variant={v}
                  disabled={pending}
                  onSave={(id, stock, priceOverride) =>
                    run(() => updateVariantAction(id, { stock, priceOverride }))
                  }
                  onAskDelete={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border border-neutral-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium">Add a variant</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-neutral-600">
            Size
            <select
              value={sizeId}
              onChange={(e) => setSizeId(e.target.value)}
              className="mt-1 block h-9 border border-neutral-300 bg-white px-3 text-sm"
            >
              <option value="">Select...</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-neutral-600">
            Color
            <select
              value={colorId}
              onChange={(e) => setColorId(e.target.value)}
              className="mt-1 block h-9 border border-neutral-300 bg-white px-3 text-sm"
            >
              <option value="">Select...</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-neutral-600">
            Stock
            <Input
              type="number"
              min={0}
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="mt-1 w-24"
            />
          </label>

          <label className="text-xs text-neutral-600">
            Price override (optional)
            <Input
              inputMode="decimal"
              value={newOverride}
              onChange={(e) => setNewOverride(e.target.value)}
              className="mt-1 w-32"
            />
          </label>

          <Button
            type="button"
            onClick={handleAdd}
            disabled={pending || !sizeId || !colorId}
          >
            {pending ? "Working..." : "Add variant"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this variant?"
        description={
          deleteTarget
            ? `${deleteTarget.size} / ${deleteTarget.color} (${deleteTarget.sku}) will be removed. This can't be undone.`
            : ""
        }
        pending={pending}
        onConfirm={() => {
          if (!deleteTarget) return;
          run(
            () => deleteVariantAction(deleteTarget.id),
            () => setDeleteTarget(null),
          );
        }}
      />
    </section>
  );
}