import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
    return (
        <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-neutral-100 px-6 text-center">
            <h1 className="font-(family-name:--font-display) text-5xl uppercase tracking-tight text-neutral-950 md:text-7xl">
                Atelier Cairo
            </h1>
            <p className="max-w-md text-neutral-600">
                Streetwear built in Egypt. Made with intention.
            </p>
            <Link href="/shop">
                <Button size="lg">
                    Shop the drop
                </Button>
            </Link>
        </section>
    );
}