"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { voidSettlementAction } from "@/features/settlements/actions";
import {
  initialSettlementFormState,
  type SettlementFormState,
} from "@/features/settlements/state";

export function VoidSettlementForm({ id }: { id: string }) {
  const [state, formAction] = useActionState<SettlementFormState, FormData>(
    voidSettlementAction,
    initialSettlementFormState,
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-destructive/30 p-4"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "¿Anular esta rendición y todos sus movimientos asociados?",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="text-sm font-medium">Motivo de anulación</span>
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="reason"
          maxLength={500}
          required
        />
      </label>
      {state.message ? (
        <p className="text-sm text-destructive" role="alert">
          {state.fieldErrors?.reason?.[0] ?? state.message}
        </p>
      ) : null}
      <VoidButton />
    </form>
  );
}

function VoidButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Anulando..." : "Anular rendición"}
    </Button>
  );
}
