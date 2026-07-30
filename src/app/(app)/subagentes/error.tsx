"use client";

import { Button } from "@/components/ui/button";

type SubagentsErrorProps = {
  reset: () => void;
};

export default function SubagentsError({ reset }: SubagentsErrorProps) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
      <h2 className="text-lg font-semibold">
        No pudimos cargar los subagentes
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocurrió un error inesperado. Podés volver a intentarlo.
      </p>
      <Button className="mt-4" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
