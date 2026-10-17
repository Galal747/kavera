"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  deleteCouponAction,
  setCouponActiveAction,
  type CouponActionResult,
} from "../actions";
import { CouponForm } from "./coupon-form";

export type CouponStatus =
  | "active"
  | "inactive"
  | "scheduled"
  | "expired"
  | "exhausted";

export type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  status: CouponStatus;
};

const STATUS_STYLES: Record<CouponStatus, { label: string; style: string }> = {
  active: { label: "Active", style: "bg-emerald-100 text-emerald-800" },
  inactive: { label: "Inactive", style: "bg-neutral-200 text-neutral-700" },
  scheduled: { label: "Scheduled", style: "bg-blue-100 text-blue-800" },
  expired: { label: "Expired", style: "bg-red-100 text-red-700" },
  exhausted: { label: "Used up", style: "bg-amber-100 text-amber-800" },
};

export function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CouponRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<CouponActionResult>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
      else onOk?.();
    });
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <CouponForm
          onDone={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Button type="button" onClick={() => setShowForm(true)}>
          New coupon
        </Button>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {coupons.length === 0 ? (
        <p className="text-center text-neutral-500">No coupons yet.</p>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min order</th>
                <th className="px-4 py-3">Valid</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = STATUS_STYLES[c.status];
                return (
                  <tr
                    key={c.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{c.code}</td>
                    <td className="px-4 py-3">
                      {c.type === "percent"
                        ? `${c.value}%`
                        : formatPrice(c.value)}
                    </td>
                    <td className="px-4 py-3">
                      {c.minOrder > 0 ? formatPrice(c.minOrder) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      <span className="block">
                        From: {c.startsAt ? formatDateTime(c.startsAt) : "now"}
                      </span>
                      <span className="block">
                        Until:{" "}
                        {c.expiresAt ? formatDateTime(c.expiresAt) : "no expiry"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.usedCount}
                      {c.usageLimit !== null ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs ${status.style}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            run(() => setCouponActiveAction(c.id, !c.isActive))
                          }
                        >
                          {c.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending || c.usedCount > 0}
                          title={
                            c.usedCount > 0
                              ? "Used coupons can't be deleted. Deactivate instead."
                              : undefined
                          }
                          onClick={() => setDeleteTarget(c)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget ? `Delete ${deleteTarget.code}?` : "Delete coupon?"}
        description="The coupon is removed permanently and can't be used anymore. This can't be undone."
        pending={pending}
        onConfirm={() => {
          if (!deleteTarget) return;
          run(
            () => deleteCouponAction(deleteTarget.id),
            () => setDeleteTarget(null),
          );
        }}
      />
    </div>
  );
}