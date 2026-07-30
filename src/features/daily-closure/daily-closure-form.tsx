"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { closeBusinessDayAction } from "@/features/daily-closure/actions";
import {
  initialDailyClosureFormState,
  type DailyClosureFormState,
} from "@/features/daily-closure/state";
import { formatMoney } from "@/lib/formatters";

const fieldClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function DailyClosureForm({
  businessDate,
  expectedBank,
  expectedCash,
}: {
  businessDate: string;
  expectedBank: number;
  expectedCash: number;
}) {
  const [countedCash, setCountedCash] = useState(String(expectedCash));
  const [reportedBank, setReportedBank] = useState(String(expectedBank));
  const [state, formAction] = useActionState<DailyClosureFormState, FormData>(
    closeBusinessDayAction,
    initialDailyClosureFormState,
  );
  const differences = useMemo(
    () => ({
      bank: Number(reportedBank || 0) - expectedBank,
      cash: Number(countedCash || 0) - expectedCash,
    }),
    [countedCash, expectedBank, expectedCash, reportedBank],
  );
  const hasDifference = differences.cash !== 0 || differences.bank !== 0;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="businessDate" value={businessDate} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Efectivo contado"
          error={state.fieldErrors?.countedCashAmount}
        >
          <input
            className={fieldClassName}
            type="number"
            name="countedCashAmount"
            value={countedCash}
            onChange={(event) => setCountedCash(event.target.value)}
            min="0"
            step="0.01"
            required
          />
          <Difference value={differences.cash} />
        </Field>
        <Field
          label="Banco informado"
          error={state.fieldErrors?.reportedBankAmount}
        >
          <input
            className={fieldClassName}
            type="number"
            name="reportedBankAmount"
            value={reportedBank}
            onChange={(event) => setReportedBank(event.target.value)}
            min="0"
            step="0.01"
            required
          />
          <Difference value={differences.bank} />
        </Field>
      </div>

      <Field
        label={hasDifference ? "Nota obligatoria" : "Nota de cierre"}
        error={state.fieldErrors?.note}
      >
        <textarea
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="note"
          maxLength={500}
          required={hasDifference}
          placeholder={
            hasDifference
              ? "Explicá el motivo de la diferencia"
              : "Observación opcional"
          }
        />
      </Field>

      {hasDifference ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Hay diferencias entre el saldo esperado y el informado. La nota es
          obligatoria y quedará auditada.
        </p>
      ) : (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Los importes informados coinciden con los saldos esperados.
        </p>
      )}

      {state.message ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end border-t pt-4">
        <CloseButton />
      </div>
    </form>
  );
}

function Difference({ value }: { value: number }) {
  return (
    <p
      className={`mt-1 text-xs ${
        value === 0 ? "text-muted-foreground" : "font-medium text-amber-700"
      }`}
    >
      Diferencia: {formatMoney(value)}
    </p>
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

function CloseButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Cerrando..." : "Cerrar día"}
    </Button>
  );
}
