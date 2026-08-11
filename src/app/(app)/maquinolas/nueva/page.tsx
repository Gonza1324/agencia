import Link from "next/link";
import { MaquinolaForm } from "@/features/maquinolas/maquinola-form";
import { getActiveSubagentsForMaquinola } from "@/features/maquinolas/queries";

export default async function NewMaquinolaPage() {
  const subagents = await getActiveSubagentsForMaquinola();
  return <div className="mx-auto max-w-2xl space-y-6"><div><Link href="/maquinolas" className="text-sm text-muted-foreground">← Volver a Maquinolas</Link><h1 className="mt-2 text-3xl font-semibold">Nueva Maquinola</h1><p className="mt-2 text-muted-foreground">El plazo de rendición comienza automáticamente al crearla.</p></div>{subagents.length ? <MaquinolaForm mode="create" subagents={subagents} /> : <p className="rounded-lg border p-6">Primero necesitás un Subagente activo.</p>}</div>;
}
