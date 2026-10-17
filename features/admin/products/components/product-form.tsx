"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slug";
import { createProductAction } from "../actions";
import { productSchema, type ProductFormValues } from "../schemas";

type Category = { id: string; name: string };

export function ProductForm({ categories }: { categories: Category[] }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: "",
      categoryId: "",
      isActive: true,
      isFeatured: false,
      isNew: false,
    },
  });

  const nameField = register("name");

  async function onSubmit(values: ProductFormValues) {
    setServerError(null);
    const result = await createProductAction(values);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="max-w-xl space-y-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          aria-invalid={errors.name ? "true" : "false"}
          {...nameField}
          onChange={(e) => {
            nameField.onChange(e);
            // نولّد الـ slug تلقائي طالما الأدمن ماعدّلوش بنفسه
            if (!dirtyFields.slug) {
              setValue("slug", slugify(e.target.value), {
                shouldValidate: true,
              });
            }
          }}
        />
        {errors.name && (
          <p className="text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug (in the URL)</Label>
        <Input
          id="slug"
          aria-invalid={errors.slug ? "true" : "false"}
          {...register("slug")}
        />
        {errors.slug && (
          <p className="text-sm text-red-600" role="alert">
            {errors.slug.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={4}
          className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (EGP)</Label>
          <Input
            id="price"
            inputMode="decimal"
            placeholder="650"
            aria-invalid={errors.price ? "true" : "false"}
            {...register("price")}
          />
          {errors.price && (
            <p className="text-sm text-red-600" role="alert">
              {errors.price.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            className="h-9 w-full border border-neutral-300 bg-white px-3 text-sm"
            aria-invalid={errors.categoryId ? "true" : "false"}
            {...register("categoryId")}
          >
            <option value="">Select...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-sm text-red-600" role="alert">
              {errors.categoryId.message}
            </p>
          )}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Visibility</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("isActive")} />
          Active (visible in the store)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("isFeatured")} />
          Featured (shown in Best sellers for now)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("isNew")} />
          New arrival
        </label>
      </fieldset>

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Create product"}
      </Button>
    </form>
  );
}