import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-6 text-center">
      <h1 className="font-(family-name:--font-display) text-5xl uppercase tracking-tight text-neutral-950 md:text-7xl">
        Atelier Cairo
      </h1>
      <p className="max-w-md text-neutral-600">
        Streetwear built in Egypt. Coming soon.
      </p>
      <Button size="lg">Shop the drop</Button>
    </main>
  );
}