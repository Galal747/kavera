"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slug";
import { createProductAction, updateProductAction } from "@/features/admin/products/actions";
import { productSchema, type ProductFormValues } from "@/features/admin/products/schemas";

type Category = { id: string; name: string };

type ProductFormProps = {
  categories: Category[];
  // لو موجود: وضع التعديل
  product?: { id: string; values: ProductFormValues };
};

// ضفنا الـ gender كقيمة افتراضية فاضية
const emptyValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  categoryId: "",
  gender: "unisex", // القيمة الافتراضية للجندر
  isActive: true,
  isFeatured: false,
  isNew: false,
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isEdit = Boolean(product);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product?.values ?? emptyValues,
  });

  const nameField = register("name");

  async function onSubmit(values: ProductFormValues) {
    setServerError(null);
    setSaved(false);

    const result = product
      ? await updateProductAction(product.id, values)
      : await createProductAction(values);

    if (result?.error) setServerError(result.error);
    if (result?.ok) setSaved(true);
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
            // الـ slug التلقائي في الإنشاء بس. في التعديل مابنغيّرش الرابط لوحدنا.
            if (!isEdit && !dirtyFields.slug) {
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
        {isEdit && (
          <p className="text-xs text-neutral-500">
            Changing the slug changes the product link. Old links will stop
            working.
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

      {/* خلينا الجريد 3 أعمدة بدل 2 عشان نحط الـ Gender جنبهم */}
      <div className="grid gap-5 sm:grid-cols-3">
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

        {/* ضفنا حقل الـ Gender هنا */}
        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            className="h-9 w-full border border-neutral-300 bg-white px-3 text-sm"
            aria-invalid={errors.gender ? "true" : "false"}
            {...register("gender")}
          >
            <option value="unisex">Unisex</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
          {errors.gender && (
            <p className="text-sm text-red-600" role="alert">
              {errors.gender.message}
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
      {saved && (
        <p className="text-sm text-emerald-700" role="status">
          Changes saved.
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Saving..."
          : isEdit
            ? "Save changes"
            : "Create product"}
      </Button>
    </form>
  );
}