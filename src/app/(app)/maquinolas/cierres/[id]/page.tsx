import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getMaquinolaSettlementById } from "@/features/maquinolas/queries";
import { VoidMaquinolaSettlementForm } from "@/features/maquinolas/void-maquinola-settlement-form";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default async function MaquinolaSettlementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const result = await getMaquinolaSettlementById(id); const settlement = result?.settlement; if (!settlement) notFound(); const payments = settlement.payments.filter((item) => !item.voided_at);
  return <div className="space-y-6"><header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:justify-between"><div><Link href="/maquinolas" className="text-sm text-muted-foreground">← Volver a Maquinolas</Link><div className="mt-2 flex items-center gap-3"><h1 className="text-3xl font-semibold">Cierre {settlement.maquinola.number}</h1><Badge variant={settlement.status === "voided" ? "muted" : settlement.status === "settled_with_debt" ? "warning" : "success"}>{settlement.status === "voided" ? "Anulado" : settlement.status === "settled_with_debt" ? "Con deuda" : "Rendido"}</Badge></div><p className="mt-2 text-muted-foreground">{formatDateKey(settlement.settlement_date)} · {settlement.subagent.name}</p></div>{result.userIsOwner && settlement.status !== "voided" ? <Link href={`/maquinolas/cierres/${id}/editar`} className={cn(buttonVariants())}>Corregir cierre</Link> : null}</header>
  <section className="grid gap-4 md:grid-cols-3"><Detail label="Venta" value={settlement.sales_amount} /><Detail label="Premios" value={settlement.prizes_paid_amount} /><Detail label="Comisión" value={0} /><Detail label="Esperado" value={settlement.expected_amount} /><Detail label="Recibido" value={settlement.received_amount} /><Detail label="Deuda" value={settlement.debt_amount} /><Detail label="Saldo por premios" value={settlement.prize_credit_amount} /><Detail label="Saldo por excedente" value={settlement.overpayment_credit_amount} /></section>
  <section className="rounded-lg border bg-card p-5"><h2 className="font-semibold">Medios de pago</h2>{payments.length ? <ul className="mt-4 space-y-2">{payments.map((payment) => <li key={payment.id} className="flex justify-between rounded-md border p-3"><span>{payment.method === "cash" ? "Efectivo" : "Banco"}</span><strong>{formatMoney(Number(payment.amount))}</strong></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Sin entrega de dinero: el esperado fue $0.</p>}<p className="mt-4 whitespace-pre-wrap text-sm">{settlement.notes || "Sin observaciones."}</p></section>
  {result.userIsOwner && settlement.status !== "voided" ? <VoidMaquinolaSettlementForm id={settlement.id} /> : null}</div>;
}
function Detail({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{formatMoney(Number(value))}</p></div>; }
