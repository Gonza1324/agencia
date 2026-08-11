"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { voidMaquinolaSettlementAction } from "@/features/maquinolas/actions";
import { initialMaquinolaFormState, type MaquinolaFormState } from "@/features/maquinolas/state";

export function VoidMaquinolaSettlementForm({ id }: { id: string }) {
  const [state, action] = useActionState<MaquinolaFormState, FormData>(voidMaquinolaSettlementAction, initialMaquinolaFormState);
  return <form action={action} className="space-y-3 rounded-lg border border-destructive/30 p-4" onSubmit={(event) => { if (!window.confirm("¿Anular este cierre y revertir todos sus movimientos?")) event.preventDefault(); }}><input type="hidden" name="id" value={id} /><label className="block"><span className="text-sm font-medium">Motivo de anulación</span><textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-3" name="reason" maxLength={500} required /></label>{state.message ? <p className="text-sm text-destructive">{state.fieldErrors?.reason?.[0] ?? state.message}</p> : null}<Button type="submit" variant="destructive">Anular cierre</Button></form>;
}
