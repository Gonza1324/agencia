"use client";

import { Button } from "@/components/ui/button";

type DashboardErrorProps = {
  reset: () => void;
};

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
      <h2 className="text-lg font-semibold">No pudimos cargar el dashboard</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        No se pudo determinar el estado operativo. Podés volver a intentarlo.
      </p>
      <Button className="mt-4" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
