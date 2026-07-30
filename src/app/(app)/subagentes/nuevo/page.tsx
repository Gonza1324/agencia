import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubagentForm } from "@/features/subagents/subagent-form";

export default function NewSubagentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b pb-5">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          href="/subagentes"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a Subagentes
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-normal">
          Nuevo Subagente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El código de máquina debe ser único entre Subagentes activos.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-5 md:p-7">
        <SubagentForm mode="create" />
      </section>
    </div>
  );
}
