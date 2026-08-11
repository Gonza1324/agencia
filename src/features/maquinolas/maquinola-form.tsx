"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  createMaquinolaAction,
  updateMaquinolaAction,
} from "@/features/maquinolas/actions";
import {
  initialMaquinolaFormState,
  type MaquinolaFormState,
} from "@/features/maquinolas/state";
import { cn } from "@/lib/utils";

export function MaquinolaForm({
  maquinola,
  mode,
  subagents,
}: {
  mode: "create" | "edit";
  maquinola?: { id: string; number: string; subagentId: string };
  subagents: Array<{ id: string; name: string; machine_code: string }>;
}) {
  const [state, action] = useActionState<MaquinolaFormState, FormData>(
    mode === "create" ? createMaquinolaAction : updateMaquinolaAction,
    initialMaquinolaFormState,
  );
  return (
    <form action={action} className="space-y-6">
      {maquinola ? <input type="hidden" name="id" value={maquinola.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="text-sm font-medium">Número de Maquinola</span>
          <input className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-mono uppercase" name="number" defaultValue={maquinola?.number} maxLength={40} required />
          <FieldError errors={state.fieldErrors?.number} />
        </label>
        <label>
          <span className="text-sm font-medium">Subagente asignado</span>
          <select className="mt-1 h-10 w-full rounded-md border bg-background px-3" name="subagentId" defaultValue={maquinola?.subagentId ?? ""} required>
            <option value="" disabled>Seleccionar Subagente</option>
            {subagents.map((subagent) => (
              <option key={subagent.id} value={subagent.id}>{subagent.name} · {subagent.machine_code}</option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.subagentId} />
        </label>
      </div>
      {maquinola ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Si cambiás el Subagente, los cierres anteriores conservarán su asignación y el nuevo plazo comenzará hoy.
        </p>
      ) : null}
      {state.message ? <p className="text-sm text-destructive" role="alert">{state.message}</p> : null}
      <div className="flex justify-end gap-3 border-t pt-5">
        <Link href={maquinola ? `/maquinolas/${maquinola.id}` : "/maquinolas"} className={cn(buttonVariants({ variant: "secondary" }))}>Cancelar</Link>
        <SaveButton mode={mode} />
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1 text-xs text-destructive">{errors[0]}</p> : null;
}

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{pending ? "Guardando..." : mode === "create" ? "Crear Maquinola" : "Guardar cambios"}</Button>;
}
