"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { OWNER_NAMES } from "@/config/business";
import { createCashMovementAction } from "@/features/cash/actions";
import {
  initialCashFormState,
  type CashFormState,
} from "@/features/cash/state";
import { cn } from "@/lib/utils";

type CashMovementFormProps = {
  accounts: Array<{ id: string; name: string; type: "bank" | "cash" }>;
  categories: Array<{
    id: string;
    name: string;
    type: "adjustment" | "expense" | "income" | "withdrawal";
  }>;
  today: string;
};

const fieldClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function CashMovementForm({
  accounts,
  categories,
  today,
}: CashMovementFormProps) {
  const [type, setType] = useState<
    "adjustment" | "expense" | "income" | "transfer" | "withdrawal"
  >("income");
  const [state, formAction] = useActionState<CashFormState, FormData>(
    createCashMovementAction,
    initialCashFormState,
  );
  const availableCategories =
    type === "transfer"
      ? []
      : categories.filter((category) => category.type === type);
  const fixedDirection =
    type === "income"
      ? "in"
      : ["expense", "withdrawal", "transfer"].includes(type)
        ? "out"
        : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Fecha operativa" error={state.fieldErrors?.businessDate}>
          <input
            className={fieldClassName}
            type="date"
            name="businessDate"
            defaultValue={today}
            max={today}
            required
          />
        </Field>
        <Field label="Tipo" error={state.fieldErrors?.type}>
          <select
            className={fieldClassName}
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
          >
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
            <option value="withdrawal">Retiro de dueño</option>
            <option value="adjustment">Ajuste</option>
            <option value="transfer">Transferencia interna</option>
          </select>
        </Field>
        <Field
          label={type === "transfer" ? "Cuenta origen" : "Cuenta"}
          error={state.fieldErrors?.accountId}
        >
          <select
            className={fieldClassName}
            name="accountId"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Seleccionar cuenta
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dirección" error={state.fieldErrors?.direction}>
          <select
            className={fieldClassName}
            name="direction"
            value={fixedDirection}
            defaultValue={fixedDirection ? undefined : "in"}
            disabled={Boolean(fixedDirection)}
          >
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
          </select>
          {fixedDirection ? (
            <input type="hidden" name="direction" value={fixedDirection} />
          ) : null}
        </Field>
        <Field label="Categoría" error={state.fieldErrors?.categoryId}>
          <select
            className={fieldClassName}
            name="categoryId"
            defaultValue=""
            disabled={type === "transfer"}
            required={type !== "transfer"}
          >
            <option value="">
              {type === "transfer" ? "No corresponde" : "Seleccionar categoría"}
            </option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Monto" error={state.fieldErrors?.amount}>
          <input
            className={fieldClassName}
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            required
          />
        </Field>
        {type === "withdrawal" ? (
          <Field label="Dueño" error={state.fieldErrors?.ownerName}>
            <select
              className={fieldClassName}
              name="ownerName"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Seleccionar dueño
              </option>
              {OWNER_NAMES.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <input type="hidden" name="ownerName" value="" />
        )}
        <Field label="Descripción" error={state.fieldErrors?.description}>
          <input
            className={fieldClassName}
            name="description"
            maxLength={160}
            placeholder="Concepto del movimiento"
          />
        </Field>
      </div>

      <Field
        label={type === "adjustment" ? "Nota obligatoria" : "Nota"}
        error={state.fieldErrors?.note}
      >
        <textarea
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="note"
          maxLength={500}
          required={type === "adjustment"}
        />
      </Field>

      {type === "transfer" ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          El destino será automáticamente la otra cuenta activa. Se crearán
          ambos asientos en una única transacción.
        </p>
      ) : null}

      {state.message ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t pt-5">
        <Link
          href="/caja"
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
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string[];
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error?.length ? (
        <p className="mt-1 text-xs text-destructive">{error[0]}</p>
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
      {pending ? "Guardando..." : "Registrar movimiento"}
    </Button>
  );
}
