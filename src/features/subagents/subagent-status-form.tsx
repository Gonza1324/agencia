"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSubagentStatusAction } from "@/features/subagents/actions";

type SubagentStatusFormProps = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

function StatusSubmitButton({
  status,
}: {
  status: SubagentStatusFormProps["status"];
}) {
  const { pending } = useFormStatus();
  const activating = status === "inactive";

  return (
    <Button
      type="submit"
      variant={activating ? "secondary" : "destructive"}
      disabled={pending}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : activating ? (
        <Power className="h-4 w-4" aria-hidden="true" />
      ) : (
        <PowerOff className="h-4 w-4" aria-hidden="true" />
      )}
      {pending
        ? "Actualizando..."
        : activating
          ? "Activar Subagente"
          : "Inactivar Subagente"}
    </Button>
  );
}

export function SubagentStatusForm({
  id,
  name,
  status,
}: SubagentStatusFormProps) {
  const activating = status === "inactive";

  return (
    <form
      action={toggleSubagentStatusAction}
      onSubmit={(event) => {
        const action = activating ? "activar" : "inactivar";
        if (!window.confirm(`¿Confirmás ${action} a ${name}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <StatusSubmitButton status={status} />
    </form>
  );
}
