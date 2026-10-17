"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const newsletterSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type NewsletterValues = z.infer<typeof newsletterSchema>;

export function NewsletterForm() {
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
  });

  async function onSubmit(values: NewsletterValues) {
    // مؤقتًا: محاكاة. هنربطها بـ Server Action + جدول في Supabase بعدين.
    await new Promise((r) => setTimeout(r, 600));
    console.log("Subscribed:", values.email);
    setDone(true);
    reset();
  }

  if (done) {
    return (
      <p className="text-sm text-emerald-400" role="status">
        You&apos;re in. Welcome to Atelier Cairo.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mx-auto w-full max-w-md"
    >
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Your email"
          aria-label="Email address"
          aria-invalid={errors.email ? "true" : "false"}
          className="bg-white text-neutral-950"
          {...register("email")}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "..." : "Subscribe"}
        </Button>
      </div>
      {errors.email && (
        <p className="mt-2 text-left text-sm text-red-400" role="alert">
          {errors.email.message}
        </p>
      )}
    </form>
  );
}