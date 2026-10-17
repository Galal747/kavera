"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "../actions";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      // لو نجح، الـ action بتعمل redirect لقايمة المنتجات
      const result = await deleteProductAction(productId);
      if (result?.error) {
        setError(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Delete product
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete "${productName}"?`}
        description="This also deletes all of its variants and can't be undone. If you only want to remove it from the store, uncheck Active instead."
        pending={pending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}