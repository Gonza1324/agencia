"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-destructive/30 bg-destructive/10 p-6">
      <h1 className="text-xl font-semibold">No pudimos cargar esta pantalla</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        La información no se modificó. Reintentá o volvé al dashboard.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
