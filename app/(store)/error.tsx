"use client";

import { ErrorContent } from "@/components/shared/error-content";

export default function StoreError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorContent {...props} />;
}