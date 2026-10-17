import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return <ForgotPasswordForm expired={error === "expired"} />;
}