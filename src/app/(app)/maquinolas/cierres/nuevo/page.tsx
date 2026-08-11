import Link from "next/link";
import { MaquinolaSettlementForm } from "@/features/maquinolas/maquinola-settlement-form";
import { getMaquinolasForSettlement } from "@/features/maquinolas/queries";
import { getArgentinaDateKey } from "@/lib/operational-days";

export default async function NewMaquinolaSettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ maquinola?: string }>;
}) {
  const params = await searchParams;
  const maquinolas = await getMaquinolasForSettlement();
  return <div className="mx-auto max-w-4xl space-y-6"><div><Link href="/maquinolas" className="text-sm text-muted-foreground">← Volver a Maquinolas</Link><h1 className="mt-2 text-3xl font-semibold">Nuevo cierre de Maquinola</h1><p className="mt-2 text-muted-foreground">Se actualizarán Caja, Banco y la cuenta corriente del Subagente en una sola operación.</p></div>{maquinolas.length ? <MaquinolaSettlementForm mode="create" maquinolas={maquinolas} today={getArgentinaDateKey()} initialMaquinolaId={maquinolas.some((item) => item.id === params.maquinola) ? params.maquinola : undefined} /> : <p className="rounded-lg border p-6">No hay Maquinolas activas con Subagente activo.</p>}</div>;
}
