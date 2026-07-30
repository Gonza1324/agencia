"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { reopenBusinessDayAction } from "@/features/daily-closure/actions";
import {
  initialDailyClosureFormState,
  type DailyClosureFormState,
} from "@/features/daily-closure/state";

export function ReopenBusinessDayForm({
  businessDate,
}: {
  businessDate: string;
}) {
  const [state, formAction] = useActionState<DailyClosureFormState, FormData>(
    reopenBusinessDayAction,
    initialDailyClosureFormState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Confirmás reabrir el día ${businessDate}? Volverá a aceptar movimientos y rendiciones.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="businessDate" value={businessDate} />
      <label className="block">
        <span className="text-sm font-medium">Motivo de reapertura</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="reason"
          minLength={3}
          maxLength={500}
          required
          placeholder="Explicá por qué se necesita modificar el día"
        />
        {state.fieldErrors?.reason?.length ? (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.reason[0]}
          </p>
        ) : null}
      </label>
      <p className="text-sm text-muted-foreground">
        Reabrir habilitará nuevamente rendiciones y movimientos para esta fecha.
        La acción quedará auditada.
      </p>
      {state.message ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <ReopenButton />
      </div>
    </form>
  );
}

function ReopenButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Reabriendo..." : "Reabrir día"}
    </Button>
  );
}
