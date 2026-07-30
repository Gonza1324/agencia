"use client";

import Link from "next/link";
import {
  type FormEvent,
  useActionState,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  createSettlementAction,
  updateSettlementAction,
} from "@/features/settlements/actions";
import {
  initialSettlementFormState,
  type SettlementFormState,
} from "@/features/settlements/state";
import { calculateSettlementAmounts } from "@/lib/commissions";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SettlementFormProps = {
  mode: "create" | "edit";
  subagents: Array<{
    commission_percentage: number;
    id: string;
    machine_code: string;
    name: string;
  }>;
  settlement?: {
    bankAmount: number;
    cashAmount: number;
    commissionAmount: number | null;
    expectedAmount: number | null;
    id: string;
    notes: string;
    paymentMethod: "bank_transfer" | "cash" | "mixed";
    prizesPaidAmount: number | null;
    salesAmount: number | null;
    settlementDate: string;
    subagentId: string;
  };
  today: string;
};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {errors[0]}
    </p>
  ) : null;
}

function SubmitButton({ mode }: { mode: SettlementFormProps["mode"] }) {
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
          ? "Registrar rendición"
          : "Guardar corrección"}
    </Button>
  );
}

export function SettlementForm({
  mode,
  settlement,
  subagents,
  today,
}: SettlementFormProps) {
  const action =
    mode === "create" ? createSettlementAction : updateSettlementAction;
  const [state, formAction] = useActionState<SettlementFormState, FormData>(
    action,
    initialSettlementFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const [showOverpaymentConfirmation, setShowOverpaymentConfirmation] =
    useState(false);
  const [subagentId, setSubagentId] = useState(settlement?.subagentId ?? "");
  const [cashAmount, setCashAmount] = useState(
    settlement?.cashAmount.toString() ?? "0",
  );
  const [bankAmount, setBankAmount] = useState(
    settlement?.bankAmount.toString() ?? "0",
  );
  const [salesAmount, setSalesAmount] = useState(
    settlement?.salesAmount?.toString() ?? "",
  );
  const [prizesPaidAmount, setPrizesPaidAmount] = useState(
    settlement?.prizesPaidAmount?.toString() ?? "",
  );
  const selectedSubagent = subagents.find(
    (subagent) => subagent.id === subagentId,
  );
  const calculatedAmounts = useMemo(
    () =>
      calculateSettlementAmounts(
        salesAmount === "" ? null : Number(salesAmount),
        selectedSubagent?.commission_percentage ?? 0,
        prizesPaidAmount === "" ? null : Number(prizesPaidAmount),
      ),
    [prizesPaidAmount, salesAmount, selectedSubagent?.commission_percentage],
  );
  const receivedAmount = (Number(cashAmount) || 0) + (Number(bankAmount) || 0);
  const overpaymentAmount =
    calculatedAmounts.expectedAmount === null
      ? 0
      : Math.max(
          Math.round(
            (receivedAmount -
              calculatedAmounts.expectedAmount +
              Number.EPSILON) *
              100,
          ) / 100,
          0,
        );

  function resetOverpaymentConfirmation() {
    if (confirmationInputRef.current) {
      confirmationInputRef.current.value = "false";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (
      overpaymentAmount > 0 &&
      confirmationInputRef.current?.value !== "true"
    ) {
      event.preventDefault();
      setShowOverpaymentConfirmation(true);
    }
  }

  function confirmOverpayment() {
    if (confirmationInputRef.current) {
      confirmationInputRef.current.value = "true";
    }
    setShowOverpaymentConfirmation(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <input
        ref={confirmationInputRef}
        type="hidden"
        name="confirmOverpayment"
        defaultValue="false"
      />
      {settlement ? (
        <input type="hidden" name="id" value={settlement.id} />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Fecha operativa</span>
          <input
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            type="date"
            name="settlementDate"
            defaultValue={settlement?.settlementDate ?? today}
            max={today}
            aria-invalid={Boolean(state.fieldErrors?.settlementDate)}
            required
          />
          <FieldError errors={state.fieldErrors?.settlementDate} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Subagente</span>
          <select
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            name="subagentId"
            value={subagentId}
            onChange={(event) => {
              resetOverpaymentConfirmation();
              setSubagentId(event.target.value);
            }}
            aria-invalid={Boolean(state.fieldErrors?.subagentId)}
            required
          >
            <option value="" disabled>
              Seleccionar Subagente
            </option>
            {subagents.map((subagent) => (
              <option key={subagent.id} value={subagent.id}>
                {subagent.name} · {subagent.machine_code}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.subagentId} />
        </label>
      </div>

      <fieldset className="rounded-lg border p-5">
        <legend className="px-2 font-semibold">Pago recibido</legend>
        <div className="grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">Medio de pago</span>
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              name="paymentMethod"
              defaultValue={settlement?.paymentMethod ?? "cash"}
            >
              <option value="cash">Efectivo</option>
              <option value="bank_transfer">Transferencia</option>
              <option value="mixed">Mixto</option>
            </select>
            <FieldError errors={state.fieldErrors?.paymentMethod} />
          </label>
          <MoneyField
            label="Monto efectivo"
            name="cashAmount"
            value={cashAmount}
            onChange={(value) => {
              resetOverpaymentConfirmation();
              setCashAmount(value);
            }}
            errors={state.fieldErrors?.cashAmount}
            required
          />
          <MoneyField
            label="Monto banco"
            name="bankAmount"
            value={bankAmount}
            onChange={(value) => {
              resetOverpaymentConfirmation();
              setBankAmount(value);
            }}
            errors={state.fieldErrors?.bankAmount}
            required
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          En pagos mixtos, ambos montos deben ser mayores a cero.
        </p>
      </fieldset>

      <fieldset className="rounded-lg border p-5">
        <legend className="px-2 font-semibold">
          Información del cierre (opcional)
        </legend>
        <div className="grid gap-5 md:grid-cols-2">
          <MoneyField
            label="Venta del día"
            name="salesAmount"
            value={salesAmount}
            onChange={(value) => {
              resetOverpaymentConfirmation();
              setSalesAmount(value);
            }}
            errors={state.fieldErrors?.salesAmount}
          />
          <CalculatedMoneyField
            label={`Comisión${
              selectedSubagent
                ? ` (${selectedSubagent.commission_percentage}%)`
                : ""
            }`}
            name="commissionAmount"
            value={calculatedAmounts.commissionAmount}
            errors={state.fieldErrors?.commissionAmount}
          />
          <MoneyField
            label="Premios pagados"
            name="prizesPaidAmount"
            value={prizesPaidAmount}
            onChange={(value) => {
              resetOverpaymentConfirmation();
              setPrizesPaidAmount(value);
            }}
            errors={state.fieldErrors?.prizesPaidAmount}
          />
          <CalculatedMoneyField
            label="Importe que debía rendir"
            name="expectedAmount"
            value={calculatedAmounts.expectedAmount}
            errors={state.fieldErrors?.expectedAmount}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          La comisión y el importe a rendir se calculan automáticamente con el
          porcentaje configurado para el Subagente.
        </p>
        {calculatedAmounts.creditBalanceAmount > 0 ? (
          <p
            className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            role="status"
          >
            Saldo a favor que se acreditará en la cuenta corriente:{" "}
            {formatMoney(calculatedAmounts.creditBalanceAmount)}
          </p>
        ) : null}
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium">Observaciones</span>
        <textarea
          className="mt-1 min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="notes"
          defaultValue={settlement?.notes}
          maxLength={1000}
          placeholder="Información adicional del cierre"
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

      {mode === "edit" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          La corrección anulará la versión actual y creará una nueva para
          conservar el historial.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        <Link
          href={settlement ? `/rendiciones/${settlement.id}` : "/rendiciones"}
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Cancelar
        </Link>
        <SubmitButton mode={mode} />
      </div>

      {showOverpaymentConfirmation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowOverpaymentConfirmation(false);
            }
          }}
        >
          <section
            aria-describedby="overpayment-description"
            aria-labelledby="overpayment-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl"
            role="dialog"
          >
            <h2 id="overpayment-title" className="text-xl font-semibold">
              El pago supera el importe esperado
            </h2>
            <p
              id="overpayment-description"
              className="mt-3 text-sm leading-6 text-muted-foreground"
            >
              Se recibieron {formatMoney(receivedAmount)} y se esperaban{" "}
              {formatMoney(calculatedAmounts.expectedAmount ?? 0)}. La
              diferencia de {formatMoney(overpaymentAmount)} quedará como saldo
              a favor en la cuenta corriente del Subagente.
            </p>
            <p className="mt-3 text-sm font-medium">
              ¿Querés registrar igualmente la rendición?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowOverpaymentConfirmation(false)}
              >
                Revisar importes
              </Button>
              <Button type="button" onClick={confirmOverpayment}>
                Confirmar y guardar
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </form>
  );
}

function MoneyField({
  defaultValue,
  errors,
  label,
  name,
  onChange,
  required,
  value,
}: {
  defaultValue?: number | null;
  errors?: string[];
  label: string;
  name: string;
  onChange?: (value: string) => void;
  required?: boolean;
  value?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        type="number"
        name={name}
        defaultValue={defaultValue ?? ""}
        value={value}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        min="0"
        step="0.01"
        required={required}
        aria-invalid={Boolean(errors)}
      />
      <FieldError errors={errors} />
    </label>
  );
}

function CalculatedMoneyField({
  errors,
  label,
  name,
  value,
}: {
  errors?: string[];
  label: string;
  name: string;
  value: number | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-1 h-10 w-full rounded-md border bg-muted/60 px-3 text-sm font-medium text-foreground"
        type="number"
        name={name}
        value={value ?? ""}
        min="0"
        step="0.01"
        readOnly
        aria-readonly="true"
        aria-invalid={Boolean(errors)}
      />
      <FieldError errors={errors} />
    </label>
  );
}
