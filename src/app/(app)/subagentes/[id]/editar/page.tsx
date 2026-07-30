import Link from "next/link";
import { notFound } from "next/navigation";

import { SubagentForm } from "@/features/subagents/subagent-form";
import { getSubagentById } from "@/features/subagents/queries";

type EditSubagentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSubagentPage({
  params,
}: EditSubagentPageProps) {
  const { id } = await params;
  const subagent = await getSubagentById(id);

  if (!subagent) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href={`/subagentes/${subagent.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al detalle
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Editar subagente
        </h1>
        <p className="text-muted-foreground">
          Actualizá los datos de {subagent.name}. Los cambios quedarán
          registrados en la auditoría.
        </p>
      </div>

      <SubagentForm
        mode="edit"
        subagent={{
          id: subagent.id,
          name: subagent.name,
          machineCode: subagent.machine_code,
          commissionPercentage: subagent.commission_percentage,
          notes: subagent.notes ?? "",
        }}
      />
    </div>
  );
}
