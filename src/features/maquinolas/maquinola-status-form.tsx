"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { toggleMaquinolaStatusAction } from "@/features/maquinolas/actions";

export function MaquinolaStatusForm({ id, status }: { id: string; status: string }) {
  return <form action={toggleMaquinolaStatusAction} onSubmit={(event) => {
    if (!window.confirm(`¿${status === "active" ? "Inactivar" : "Activar"} esta Maquinola?`)) event.preventDefault();
  }}><input type="hidden" name="id" value={id} /><StatusButton status={status} /></form>;
}

function StatusButton({ status }: { status: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Guardando..." : status === "active" ? "Inactivar" : "Activar"}</Button>;
}
