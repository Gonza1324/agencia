import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="max-w-md text-center">
        <p className="text-sm font-medium text-primary">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold">Página no encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          La dirección no existe o el registro solicitado ya no está disponible.
        </p>
        <Link href="/dashboard" className={cn(buttonVariants(), "mt-6")}>
          Ir al dashboard
        </Link>
      </section>
    </main>
  );
}
