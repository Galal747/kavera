"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EGYPT_GOVERNORATES } from "@/lib/egypt";
import { createAddressAction, updateAddressAction } from "../actions";
import { addressSchema, type AddressFormValues } from "../schemas";

export type AddressRow = {
  id: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  notes: string | null;
  isDefault: boolean;
};

type AddressFormProps = {
  address?: AddressRow; // لو موجود: وضع التعديل
  showDefaultOption: boolean;
  onDone: () => void;
  onCancel: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

export function AddressForm({
  address,
  showDefaultOption,
  onDone,
  onCancel,
}: AddressFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          fullName: address.fullName,
          phone: address.phone,
          governorate: address.governorate as AddressFormValues["governorate"],
          city: address.city,
          street: address.street,
          notes: address.notes ?? "",
          makeDefault: false,
        }
      : { fullName: "", phone: "", city: "", street: "", notes: "", makeDefault: false },
  });

  async function onSubmit(values: AddressFormValues) {
    setServerError(null);
    const result = address
      ? await updateAddressAction(address.id, values)
      : await createAddressAction(values);

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
        {address ? "Edit address" : "New address"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={errors.fullName ? "true" : "false"}
            {...register("fullName")}
          />
          <FieldError message={errors.fullName?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="01012345678"
            aria-invalid={errors.phone ? "true" : "false"}
            {...register("phone")}
          />
          <FieldError message={errors.phone?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="governorate">Governorate</Label>
          <select
            id="governorate"
            className="h-9 w-full border border-neutral-300 bg-white px-3 text-sm"
            aria-invalid={errors.governorate ? "true" : "false"}
            {...register("governorate")}
          >
            <option value="">Select...</option>
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <FieldError message={errors.governorate?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City / area</Label>
          <Input
            id="city"
            autoComplete="address-level2"
            aria-invalid={errors.city ? "true" : "false"}
            {...register("city")}
          />
          <FieldError message={errors.city?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="street">Street address</Label>
        <Input
          id="street"
          autoComplete="street-address"
          aria-invalid={errors.street ? "true" : "false"}
          {...register("street")}
        />
        <FieldError message={errors.street?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Apartment / landmark (optional)</Label>
        <Input
          id="notes"
          aria-invalid={errors.notes ? "true" : "false"}
          {...register("notes")}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {showDefaultOption && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("makeDefault")} />
          Use as my default address
        </label>
      )}

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save address"}
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