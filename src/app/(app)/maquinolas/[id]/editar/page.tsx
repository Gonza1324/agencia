import Link from "next/link";
import { notFound } from "next/navigation";
import { MaquinolaForm } from "@/features/maquinolas/maquinola-form";
import { getActiveSubagentsForMaquinola, getMaquinolaById } from "@/features/maquinolas/queries";

export default async function EditMaquinolaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const [maquinola, subagents] = await Promise.all([getMaquinolaById(id), getActiveSubagentsForMaquinola()]); if (!maquinola) notFound();
  return <div className="mx-auto max-w-2xl space-y-6"><div><Link href={`/maquinolas/${id}`} className="text-sm text-muted-foreground">← Volver al detalle</Link><h1 className="mt-2 text-3xl font-semibold">Editar Maquinola</h1></div><MaquinolaForm mode="edit" maquinola={{ id, number: maquinola.number, subagentId: maquinola.subagent_id }} subagents={subagents} /></div>;
}
