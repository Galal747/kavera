"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  deleteAddressAction,
  setDefaultAddressAction,
  type AddressActionResult,
} from "../actions";
import { AddressForm, type AddressRow } from "./address-form";

const MAX_ADDRESSES = 5;

export function AddressesManager({ addresses }: { addresses: AddressRow[] }) {
  // "new" = فورم إضافة، أو id عنوان = فورم تعديل، أو null = مفيش فورم
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddressRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<AddressActionResult>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
      else onOk?.();
    });
  }

  const canAdd = addresses.length < MAX_ADDRESSES;

  return (
    <div className="space-y-6">
      {addresses.length === 0 && editing !== "new" && (
        <p className="text-neutral-600">
          You haven&apos;t saved any addresses yet.
        </p>
      )}

      <ul className="space-y-4">
        {addresses.map((a) =>
          editing === a.id ? (
            <li key={a.id}>
              <AddressForm
                address={a}
                showDefaultOption={!a.isDefault}
                onDone={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <li
              key={a.id}
              className="flex flex-col gap-4 border border-neutral-200 bg-white p-5 sm:flex-row sm:justify-between"
            >
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  {a.fullName}
                  {a.isDefault && (
                    <span className="bg-neutral-950 px-2 py-0.5 text-xs uppercase tracking-wider text-white">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-neutral-700">{a.street}</p>
                {a.notes && <p className="text-neutral-600">{a.notes}</p>}
                <p className="text-neutral-700">
                  {a.city}, {a.governorate}
                </p>
                <p className="text-neutral-600">{a.phone}</p>
              </div>

              <div className="flex flex-wrap items-start gap-2">
                {!a.isDefault && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => run(() => setDefaultAddressAction(a.id))}
                  >
                    Set as default
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditing(a.id)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setDeleteTarget(a)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <AddressForm
          showDefaultOption={addresses.length > 0}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div>
          <Button
            type="button"
            onClick={() => setEditing("new")}
            disabled={!canAdd || pending}
          >
            Add a new address
          </Button>
          {!canAdd && (
            <p className="mt-2 text-xs text-neutral-500">
              You can save up to {MAX_ADDRESSES} addresses. Delete one to add
              another.
            </p>
          )}
        </div>
      )}

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
        title="Delete this address?"
        description={
          deleteTarget
            ? `${deleteTarget.street}, ${deleteTarget.city} will be removed from your saved addresses.`
            : ""
        }
        pending={pending}
        onConfirm={() => {
          if (!deleteTarget) return;
          run(
            () => deleteAddressAction(deleteTarget.id),
            () => setDeleteTarget(null),
          );
        }}
      />
    </div>
  );
}