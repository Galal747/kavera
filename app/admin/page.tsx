import { requireAdmin } from "@/lib/auth";

export default async function AdminHomePage() {
  await requireAdmin(); // نعيد التحقق هنا كمان، مش بس في الـ layout

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Admin tools are coming in the next milestones.
      </p>
    </div>
  );
}