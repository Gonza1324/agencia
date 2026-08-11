"use client";

import Link from "next/link";
import { type FormEvent, useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  createMaquinolaSettlementAction,
  updateMaquinolaSettlementAction,
} from "@/features/maquinolas/actions";
import { initialMaquinolaFormState, type MaquinolaFormState } from "@/features/maquinolas/state";
import { calculateRemainingPayment } from "@/lib/commissions";
import { formatMoney } from "@/lib/formatters";
import { calculateMaquinolaSettlement } from "@/lib/maquinola-settlements";
import { cn } from "@/lib/utils";

type Unit = { id: string; number: string; subagent: { id: string; name: string; status: string } };

export function MaquinolaSettlementForm({
  maquinolas,
  mode,
  settlement,
  today,
  initialMaquinolaId,
}: {
  maquinolas: Unit[];
  mode: "create" | "edit";
  settlement?: {
    id: string; maquinolaId: string; settlementDate: string; cashAmount: number;
    bankAmount: number; salesAmount: number; prizesPaidAmount: number; notes: string;
  };
  today: string;
  initialMaquinolaId?: string;
}) {
  const [state, action] = useActionState<MaquinolaFormState, FormData>(mode === "create" ? createMaquinolaSettlementAction : updateMaquinolaSettlementAction, initialMaquinolaFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAmounts, setConfirmationAmounts] = useState({
    expected: 0,
    overpayment: 0,
    received: 0,
  });
  const [maquinolaId, setMaquinolaId] = useState(
    settlement?.maquinolaId ?? initialMaquinolaId ?? "",
  );
  const [cashAmount, setCashAmount] = useState(String(settlement?.cashAmount ?? 0));
  const [bankAmount, setBankAmount] = useState(String(settlement?.bankAmount ?? 0));
  const [salesAmount, setSalesAmount] = useState(String(settlement?.salesAmount ?? ""));
  const [prizesPaidAmount, setPrizesPaidAmount] = useState(String(settlement?.prizesPaidAmount ?? ""));
  const received = (Number(cashAmount) || 0) + (Number(bankAmount) || 0);
  const calculated = useMemo(() => calculateMaquinolaSettlement(Number(salesAmount) || 0, Number(prizesPaidAmount) || 0, received), [salesAmount, prizesPaidAmount, received]);
  const paymentMethod = Number(cashAmount) > 0 && Number(bankAmount) > 0 ? "mixed" : Number(bankAmount) > 0 ? "bank_transfer" : "cash";

  function resetConfirmation() { if (confirmRef.current) confirmRef.current.value = "false"; }
  function fillRemaining(method: "cash" | "bank") {
    const other = method === "cash" ? Number(bankAmount) || 0 : Number(cashAmount) || 0;
    const amount = String(calculateRemainingPayment(calculated.expectedAmount, other));
    resetConfirmation();
    if (method === "cash") setCashAmount(amount); else setBankAmount(amount);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const currentReceived =
      Number(formData.get("cashAmount")) + Number(formData.get("bankAmount"));
    const currentAmounts = calculateMaquinolaSettlement(
      Number(formData.get("salesAmount")),
      Number(formData.get("prizesPaidAmount")),
      currentReceived,
    );

    if (
      currentAmounts.overpaymentCreditAmount > 0 &&
      confirmRef.current?.value !== "true"
    ) {
      event.preventDefault();
      setConfirmationAmounts({
        expected: currentAmounts.expectedAmount,
        overpayment: currentAmounts.overpaymentCreditAmount,
        received: currentReceived,
      });
      setShowConfirmation(true);
    }
  }
  function confirm() { if (confirmRef.current) confirmRef.current.value = "true"; setShowConfirmation(false); formRef.current?.requestSubmit(); }

  return <form ref={formRef} action={action} className="space-y-6" onSubmit={submit}>
    <input ref={confirmRef} type="hidden" name="confirmOverpayment" defaultValue="false" />
    <input type="hidden" name="paymentMethod" value={paymentMethod} />
    {settlement ? <input type="hidden" name="id" value={settlement.id} /> : null}
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Fecha operativa" name="settlementDate" type="date" defaultValue={settlement?.settlementDate ?? today} max={today} errors={state.fieldErrors?.settlementDate} />
      <label><span className="text-sm font-medium">Maquinola</span><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" name="maquinolaId" value={maquinolaId} onChange={(e) => setMaquinolaId(e.target.value)} required><option value="" disabled>Seleccionar Maquinola</option>{maquinolas.map((unit) => <option key={unit.id} value={unit.id}>{unit.number} · {unit.subagent.name}</option>)}</select><ErrorText errors={state.fieldErrors?.maquinolaId} /></label>
    </div>
    <fieldset className="rounded-lg border p-5"><legend className="px-2 font-semibold">Información del cierre</legend><div className="grid gap-5 md:grid-cols-2">
      <MoneyField label="Venta del día" name="salesAmount" value={salesAmount} onChange={(v) => { resetConfirmation(); setSalesAmount(v); }} errors={state.fieldErrors?.salesAmount} />
      <MoneyField label="Premios pagados" name="prizesPaidAmount" value={prizesPaidAmount} onChange={(v) => { resetConfirmation(); setPrizesPaidAmount(v); }} errors={state.fieldErrors?.prizesPaidAmount} />
      <ReadOnlyMoney label="Importe que debía rendir" value={calculated.expectedAmount} />
      <ReadOnlyMoney label="Comisión" value={0} helper="Las Maquinolas no generan comisión." />
    </div>
    {calculated.prizeCreditAmount > 0 ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Saldo a favor por premios: {formatMoney(calculated.prizeCreditAmount)}</p> : null}
    </fieldset>
    <fieldset className="rounded-lg border p-5"><legend className="px-2 font-semibold">Pago recibido</legend><div className="grid gap-5 md:grid-cols-2">
      <MoneyField label="Monto efectivo" name="cashAmount" value={cashAmount} onChange={(v) => { resetConfirmation(); setCashAmount(v); }} onFill={() => fillRemaining("cash")} errors={state.fieldErrors?.cashAmount} />
      <MoneyField label="Monto banco" name="bankAmount" value={bankAmount} onChange={(v) => { resetConfirmation(); setBankAmount(v); }} onFill={() => fillRemaining("bank")} errors={state.fieldErrors?.bankAmount} />
    </div><p className="mt-3 text-xs text-muted-foreground">El efectivo ingresa a Caja y las transferencias a Banco.</p></fieldset>
    <label className="block"><span className="text-sm font-medium">Observaciones</span><textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-3" name="notes" defaultValue={settlement?.notes} maxLength={1000} /></label>
    {state.message ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p> : null}
    {mode === "edit" ? <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">La corrección anulará la versión actual y revertirá sus movimientos antes de crear la nueva.</p> : null}
    <div className="flex justify-end gap-3 border-t pt-5"><Link href={settlement ? `/maquinolas/cierres/${settlement.id}` : "/maquinolas"} className={cn(buttonVariants({ variant: "secondary" }))}>Cancelar</Link><SubmitButton mode={mode} /></div>
    {showConfirmation ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowConfirmation(false); }}><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl"><h2 className="text-xl font-semibold">El pago supera el importe esperado</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Se recibieron {formatMoney(confirmationAmounts.received)} y se esperaban {formatMoney(confirmationAmounts.expected)}. La diferencia de {formatMoney(confirmationAmounts.overpayment)} quedará a favor en la cuenta corriente.</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowConfirmation(false)}>Revisar importes</Button><Button type="button" onClick={confirm}>Confirmar y guardar</Button></div></section></div> : null}
  </form>;
}

function ErrorText({ errors }: { errors?: string[] }) { return errors?.[0] ? <p className="mt-1 text-xs text-destructive">{errors[0]}</p> : null; }
function Field({ label, name, errors, ...props }: { label: string; name: string; errors?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) { return <label><span className="text-sm font-medium">{label}</span><input className="mt-1 h-10 w-full rounded-md border bg-background px-3" name={name} required {...props} /><ErrorText errors={errors} /></label>; }
function MoneyField({ label, name, value, onChange, onFill, errors }: { label: string; name: string; value: string; onChange: (value: string) => void; onFill?: () => void; errors?: string[] }) { return <div><div className="flex min-h-7 items-center justify-between gap-2"><label className="text-sm font-medium" htmlFor={name}>{label}</label>{onFill ? <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={onFill}>Completar restante</Button> : null}</div><input id={name} className="mt-1 h-10 w-full rounded-md border bg-background px-3" type="number" name={name} min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} required /><ErrorText errors={errors} /></div>; }
function ReadOnlyMoney({ label, value, helper }: { label: string; value: number; helper?: string }) { return <label><span className="text-sm font-medium">{label}</span><input className="mt-1 h-10 w-full rounded-md border bg-muted/60 px-3 font-medium" type="number" value={value} readOnly />{helper ? <span className="mt-1 block text-xs text-muted-foreground">{helper}</span> : null}</label>; }
function SubmitButton({ mode }: { mode: "create" | "edit" }) { const { pending } = useFormStatus(); return <Button disabled={pending}>{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{pending ? "Guardando..." : mode === "create" ? "Registrar cierre" : "Guardar corrección"}</Button>; }
