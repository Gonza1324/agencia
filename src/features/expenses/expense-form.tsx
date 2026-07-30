"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { createExpenseObligationAction } from "@/features/expenses/actions";
import {
  initialExpenseFormState,
  type ExpenseFormState,
} from "@/features/expenses/state";
import { cn } from "@/lib/utils";

const fieldClassName =
  "mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function ExpenseForm({
  categories,
  today,
}: {
  categories: Array<{ id: string; name: string }>;
  today: string;
}) {
  const [state, formAction] = useActionState<ExpenseFormState, FormData>(
    createExpenseObligationAction,
    initialExpenseFormState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Descripción" errors={state.fieldErrors?.description}>
          <input
            className={fieldClassName}
            name="description"
            maxLength={160}
            placeholder="Ej. Alquiler del local"
            required
          />
        </Field>
        <Field label="Categoría" errors={state.fieldErrors?.categoryId}>
          <select
            className={fieldClassName}
            name="categoryId"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Seleccionar categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Monto" errors={state.fieldErrors?.amount}>
          <input
            className={fieldClassName}
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            required
          />
        </Field>
        <Field label="Vencimiento" errors={state.fieldErrors?.dueDate}>
          <input
            className={fieldClassName}
            type="date"
            name="dueDate"
            defaultValue={today}
            required
          />
        </Field>
        <Field label="Repetición" errors={state.fieldErrors?.recurrenceMonths}>
          <select
            className={fieldClassName}
            name="recurrenceMonths"
            defaultValue=""
          >
            <option value="">Una sola vez</option>
            <option value="1">Mensual</option>
            <option value="2">Cada 2 meses</option>
            <option value="3">Trimestral</option>
            <option value="6">Semestral</option>
            <option value="12">Anual</option>
          </select>
        </Field>
      </div>

      <Field label="Notas" errors={state.fieldErrors?.notes}>
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="notes"
          maxLength={500}
          placeholder="Información opcional"
        />
      </Field>

      {state.message ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t pt-5">
        <Link
          href="/gastos"
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

function Field({
  children,
  errors,
  label,
}: {
  children: React.ReactNode;
  errors?: string[];
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {errors?.length ? (
        <p className="mt-1 text-xs text-destructive">{errors[0]}</p>
      ) : null}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Guardando..." : "Guardar obligación"}
    </Button>
  );
}
