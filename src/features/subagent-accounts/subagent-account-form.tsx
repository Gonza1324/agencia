"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSubagentAccountMovementAction } from "@/features/subagent-accounts/actions";
import {
  initialSubagentAccountFormState,
  type SubagentAccountFormState,
} from "@/features/subagent-accounts/state";

type Account = {
  id: string;
  name: string;
  type: "bank" | "cash";
};

const fieldClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function SubagentAccountForm({
  accounts,
  balance,
  subagentId,
  today,
}: {
  accounts: Account[];
  balance: number;
  subagentId: string;
  today: string;
}) {
  const [type, setType] = useState<
    | "compensation"
    | "debt_payment"
    | "negative_adjustment"
    | "positive_adjustment"
  >("debt_payment");
  const [state, formAction] = useActionState<
    SubagentAccountFormState,
    FormData
  >(createSubagentAccountMovementAction, initialSubagentAccountFormState);
  const isPayment = type === "debt_payment";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="subagentId" value={subagentId} />
      <div className="grid gap-4 sm:grid-cols-2">
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
        <Field label="Movimiento" error={state.fieldErrors?.type}>
          <select
            className={fieldClassName}
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
          >
            <option value="debt_payment">Pago de deuda</option>
            <option value="negative_adjustment">Ajuste que reduce deuda</option>
            <option value="positive_adjustment">
              Ajuste que aumenta deuda
            </option>
            <option value="compensation">Compensación</option>
          </select>
        </Field>
        <Field label="Monto" error={state.fieldErrors?.amount}>
          <input
            className={fieldClassName}
            type="number"
            name="amount"
            min="0.01"
            max={type === "positive_adjustment" ? undefined : balance}
            step="0.01"
            required
          />
        </Field>
        <Field
          label="Cuenta de ingreso"
          error={state.fieldErrors?.cashAccountId}
        >
          <select
            className={fieldClassName}
            name="cashAccountId"
            defaultValue=""
            disabled={!isPayment}
            required={isPayment}
          >
            <option value="">
              {isPayment ? "Seleccionar cuenta" : "No corresponde"}
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type === "cash" ? "caja" : "banco"})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={isPayment ? "Nota" : "Motivo obligatorio"}
        error={state.fieldErrors?.notes}
      >
        <textarea
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="notes"
          maxLength={500}
          required={!isPayment}
          placeholder={
            isPayment
              ? "Referencia opcional del cobro"
              : "Explicá el motivo del movimiento"
          }
        />
      </Field>

      <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        {isPayment
          ? "El pago ingresará en Caja y reducirá la deuda en una sola operación."
          : type === "positive_adjustment"
            ? "Este ajuste aumentará el saldo adeudado."
            : "Este movimiento reducirá la deuda. El sistema impedirá generar saldo a favor."}
      </p>

      {state.message ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end border-t pt-4">
        <SubmitButton
          disabled={balance <= 0 && type !== "positive_adjustment"}
        />
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

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Registrando..." : "Registrar movimiento"}
    </Button>
  );
}
