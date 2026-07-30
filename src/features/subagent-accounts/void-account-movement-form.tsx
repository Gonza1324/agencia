"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { voidSubagentAccountMovementAction } from "@/features/subagent-accounts/actions";

export function VoidAccountMovementForm({
  movementId,
  subagentId,
}: {
  movementId: string;
  subagentId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Anular
      </Button>
    );
  }

  return (
    <form
      action={voidSubagentAccountMovementAction}
      className="flex w-full flex-col gap-2 sm:flex-row"
    >
      <input type="hidden" name="movementId" value={movementId} />
      <input type="hidden" name="subagentId" value={subagentId} />
      <input
        className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
        name="reason"
        placeholder="Motivo obligatorio"
        maxLength={500}
        autoFocus
        required
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" variant="destructive">
          Confirmar
        </Button>
      </div>
    </form>
  );
}
