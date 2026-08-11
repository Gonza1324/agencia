import Link from "next/link";
import { notFound } from "next/navigation";
import { MaquinolaSettlementForm } from "@/features/maquinolas/maquinola-settlement-form";
import { getMaquinolasForSettlement, getMaquinolaSettlementForEdit } from "@/features/maquinolas/queries";
import { getArgentinaDateKey } from "@/lib/operational-days";

export default async function EditMaquinolaSettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const [result, maquinolas] = await Promise.all([getMaquinolaSettlementForEdit(id), getMaquinolasForSettlement()]); const settlement = result?.settlement; if (!settlement || settlement.status === "voided") notFound(); const payments = settlement.payments.filter((item) => !item.voided_at); const cash = Number(payments.find((item) => item.method === "cash")?.amount ?? 0); const bank = Number(payments.find((item) => item.method === "bank_transfer")?.amount ?? 0);
  return <div className="mx-auto max-w-4xl space-y-6"><div><Link href={`/maquinolas/cierres/${id}`} className="text-sm text-muted-foreground">← Volver al cierre</Link><h1 className="mt-2 text-3xl font-semibold">Corregir cierre de Maquinola</h1></div><MaquinolaSettlementForm mode="edit" maquinolas={maquinolas} today={getArgentinaDateKey()} settlement={{ id, maquinolaId: settlement.maquinola_id, settlementDate: settlement.settlement_date, cashAmount: cash, bankAmount: bank, salesAmount: Number(settlement.sales_amount), prizesPaidAmount: Number(settlement.prizes_paid_amount), notes: settlement.notes ?? "" }} /></div>;
}
