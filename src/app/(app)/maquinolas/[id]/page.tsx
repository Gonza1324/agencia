import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MaquinolaStatusForm } from "@/features/maquinolas/maquinola-status-form";
import { getMaquinolaById, getMaquinolaSettlements } from "@/features/maquinolas/queries";
import { formatDateKey, formatDateTime, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default async function MaquinolaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string; status?: string }> }) {
  const { id } = await params; const notices = await searchParams;
  const [maquinola, allSettlements] = await Promise.all([getMaquinolaById(id), getMaquinolaSettlements()]);
  if (!maquinola) notFound();
  const settlements = allSettlements.filter((item) => item.maquinola_id === maquinola.id);
  return <div className="space-y-6"><header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:justify-between"><div><Link href="/maquinolas" className="text-sm text-muted-foreground">← Volver a Maquinolas</Link><div className="mt-2 flex items-center gap-3"><h1 className="text-3xl font-semibold">Maquinola {maquinola.number}</h1><Badge variant={maquinola.status === "active" ? "success" : "muted"}>{maquinola.status === "active" ? "Activa" : "Inactiva"}</Badge></div><p className="mt-2 text-muted-foreground">Asignada a {maquinola.subagent.name}</p></div><div className="flex flex-wrap gap-2"><Link href={`/maquinolas/cierres/nuevo?maquinola=${maquinola.id}`} className={cn(buttonVariants())}>Registrar cierre</Link><Link href={`/maquinolas/${maquinola.id}/editar`} className={cn(buttonVariants({ variant: "secondary" }))}>Editar</Link><MaquinolaStatusForm id={maquinola.id} status={maquinola.status} /></div></header>
  {notices.created || notices.updated || notices.status ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Los cambios se guardaron correctamente.</p> : null}
  <section className="grid gap-4 md:grid-cols-3"><Summary label="Subagente" value={maquinola.subagent.name} /><Summary label="Obligación desde" value={formatDateKey(maquinola.assigned_at)} /><Summary label="Última actualización" value={formatDateTime(maquinola.updated_at)} /></section>
  <section className="rounded-lg border bg-card"><h2 className="border-b p-4 font-semibold">Historial de cierres</h2>{settlements.length ? <div className="divide-y">{settlements.map((item) => <Link key={item.id} href={`/maquinolas/cierres/${item.id}`} className="flex flex-col gap-2 p-4 hover:bg-muted/40 sm:flex-row sm:justify-between"><div><p className="font-medium">{formatDateKey(item.settlement_date)}</p><p className="text-sm text-muted-foreground">Venta {formatMoney(Number(item.sales_amount))} · Premios {formatMoney(Number(item.prizes_paid_amount))}</p></div><div className="text-left sm:text-right"><p className="font-semibold">{formatMoney(Number(item.received_amount))}</p><p className="text-xs text-muted-foreground">{item.status === "voided" ? "Anulado" : item.status === "settled_with_debt" ? "Con deuda" : "Rendido"}</p></div></Link>)}</div> : <p className="p-8 text-center text-sm text-muted-foreground">Sin cierres registrados.</p>}</section></div>;
}
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
