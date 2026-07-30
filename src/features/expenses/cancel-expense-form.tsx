"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cancelExpenseObligationAction } from "@/features/expenses/actions";
import {
  initialExpenseFormState,
  type ExpenseFormState,
} from "@/features/expenses/state";

export function CancelExpenseForm({ id }: { id: string }) {
  const [state, formAction] = useActionState<ExpenseFormState, FormData>(
    cancelExpenseObligationAction,
    initialExpenseFormState,
  );

  return (
    <form
      action={formAction}
      className="mt-3 min-w-72 space-y-3 rounded-md border border-destructive/30 bg-background p-3"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "¿Cancelar esta obligación? Si es recurrente, no se generarán nuevos vencimientos.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="obligationId" value={id} />
      <label className="block text-left">
        <span className="text-sm font-medium">Motivo de cancelación</span>
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="reason"
          maxLength={500}
          required
        />
      </label>
      {state.message ? (
        <p className="text-left text-xs text-destructive" role="alert">
          {state.fieldErrors?.reason?.[0] ?? state.message}
        </p>
      ) : null}
      <CancelButton />
    </form>
  );
}

function CancelButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full"
      type="submit"
      variant="destructive"
      size="sm"
      disabled={pending}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Cancelando..." : "Confirmar cancelación"}
    </Button>
  );
}
