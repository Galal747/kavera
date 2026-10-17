"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCouponAction } from "../actions";
import { couponSchema, type CouponFormValues } from "../schemas";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

export function CouponForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      type: "percent",
      value: "",
      minOrder: "",
      startsAt: "",
      expiresAt: "",
      usageLimit: "",
    },
  });

  const type = watch("type");

  async function onSubmit(values: CouponFormValues) {
    setServerError(null);
    const result = await createCouponAction(values);
    if (result?.error) setServerError(result.error);
    else onDone();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 border border-neutral-200 bg-white p-5"
    >
      <h2 className="font-[family-name:var(--font-display)] text-xl uppercase">
        New coupon
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            autoCapitalize="characters"
            className="uppercase"
            aria-invalid={errors.code ? "true" : "false"}
            {...register("code")}
          />
          <FieldError message={errors.code?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            className="h-9 w-full border border-neutral-300 bg-white px-3 text-sm"
            {...register("type")}
          >
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed amount (EGP)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="value">
            {type === "percent" ? "Discount (%)" : "Discount (EGP)"}
          </Label>
          <Input
            id="value"
            inputMode="decimal"
            aria-invalid={errors.value ? "true" : "false"}
            {...register("value")}
          />
          <FieldError message={errors.value?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="minOrder">Minimum order (EGP, optional)</Label>
          <Input
            id="minOrder"
            inputMode="decimal"
            aria-invalid={errors.minOrder ? "true" : "false"}
            {...register("minOrder")}
          />
          <FieldError message={errors.minOrder?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Starts on (optional)</Label>
          <Input
            id="startsAt"
            type="date"
            aria-invalid={errors.startsAt ? "true" : "false"}
            {...register("startsAt")}
          />
          <FieldError message={errors.startsAt?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expiresAt">Expires on (optional)</Label>
          <Input
            id="expiresAt"
            type="date"
            aria-invalid={errors.expiresAt ? "true" : "false"}
            {...register("expiresAt")}
          />
          <FieldError message={errors.expiresAt?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="usageLimit">Total uses (optional)</Label>
          <Input
            id="usageLimit"
            inputMode="numeric"
            aria-invalid={errors.usageLimit ? "true" : "false"}
            {...register("usageLimit")}
          />
          <FieldError message={errors.usageLimit?.message} />
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Dates use Cairo time: a coupon starts at 00:00 on its start date and
        ends at 23:59 on its expiry date. A coupon&apos;s values can&apos;t be
        edited after it&apos;s created. Create a new one instead.
      </p>

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create coupon"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}