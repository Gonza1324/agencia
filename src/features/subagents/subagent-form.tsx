"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  createSubagentAction,
  updateSubagentAction,
} from "@/features/subagents/actions";
import {
  initialSubagentFormState,
  type SubagentFormState,
} from "@/features/subagents/state";
import { cn } from "@/lib/utils";

type SubagentFormProps = {
  mode: "create" | "edit";
  subagent?: {
    id: string;
    name: string;
    machineCode: string;
    commissionPercentage: number;
    notes: string;
  };
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {errors[0]}
    </p>
  );
}

function SubmitButton({ mode }: { mode: SubagentFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Save className="h-4 w-4" aria-hidden="true" />
      )}
      {pending
        ? "Guardando..."
        : mode === "create"
          ? "Crear Subagente"
          : "Guardar cambios"}
    </Button>
  );
}

export function SubagentForm({ mode, subagent }: SubagentFormProps) {
  const action =
    mode === "create" ? createSubagentAction : updateSubagentAction;
  const [state, formAction] = useActionState<SubagentFormState, FormData>(
    action,
    initialSubagentFormState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {subagent ? <input type="hidden" name="id" value={subagent.id} /> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Nombre</span>
          <input
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            name="name"
            defaultValue={subagent?.name}
            maxLength={120}
            autoComplete="off"
            aria-invalid={Boolean(state.fieldErrors?.name)}
            required
          />
          <FieldError errors={state.fieldErrors?.name} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Código de máquina</span>
          <input
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-ring"
            name="machineCode"
            defaultValue={subagent?.machineCode}
            maxLength={30}
            autoComplete="off"
            aria-invalid={Boolean(state.fieldErrors?.machineCode)}
            required
          />
          <FieldError errors={state.fieldErrors?.machineCode} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Comisión sobre la venta</span>
          <div className="relative mt-1">
            <input
              className="h-10 w-full rounded-md border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
              type="number"
              name="commissionPercentage"
              list="commission-percentages"
              defaultValue={subagent?.commissionPercentage ?? 10}
              min="0"
              max="100"
              step="0.01"
              aria-invalid={Boolean(state.fieldErrors?.commissionPercentage)}
              required
            />
            <span className="pointer-events-none absolute right-3 top-2 text-sm text-muted-foreground">
              %
            </span>
          </div>
          <datalist id="commission-percentages">
            <option value="5" />
            <option value="7.5" />
            <option value="10" />
            <option value="12.5" />
            <option value="15" />
            <option value="20" />
          </datalist>
          <p className="mt-1 text-xs text-muted-foreground">
            Elegí una sugerencia o escribí cualquier porcentaje.
          </p>
          <FieldError errors={state.fieldErrors?.commissionPercentage} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Observaciones</span>
        <textarea
          className="mt-1 min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="notes"
          defaultValue={subagent?.notes}
          maxLength={1000}
          aria-invalid={Boolean(state.fieldErrors?.notes)}
          placeholder="Información interna opcional"
        />
        <FieldError errors={state.fieldErrors?.notes} />
      </label>

      {state.message ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        <Link
          href={subagent ? `/subagentes/${subagent.id}` : "/subagentes"}
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Cancelar
        </Link>
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
