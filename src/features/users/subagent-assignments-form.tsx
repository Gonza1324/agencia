"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Link2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateSubagentAssignmentsAction } from "@/features/users/actions";
import {
  initialUserFormState,
  type UserFormState,
} from "@/features/users/state";

export function SubagentAssignmentsForm({
  assignedSubagentIds,
  subagents,
  userId,
}: {
  assignedSubagentIds: string[];
  subagents: Array<{
    id: string;
    machine_code: string;
    name: string;
    status: "active" | "inactive";
  }>;
  userId: string;
}) {
  const [state, formAction] = useActionState<UserFormState, FormData>(
    updateSubagentAssignmentsAction,
    initialUserFormState,
  );

  return (
    <details className="mt-4 border-t pt-4">
      <summary className="cursor-pointer text-sm font-medium">
        Máquinas asignadas ({assignedSubagentIds.length})
      </summary>
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="userId" value={userId} />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {subagents.map((subagent) => (
            <label
              key={subagent.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3"
            >
              <input
                className="mt-1 h-4 w-4"
                type="checkbox"
                name="subagentIds"
                value={subagent.id}
                defaultChecked={assignedSubagentIds.includes(subagent.id)}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {subagent.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {subagent.machine_code}
                  {subagent.status === "inactive" ? " · Inactiva" : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.message ? (
          <p
            className={
              state.status === "success"
                ? "text-sm text-emerald-700"
                : "text-sm text-destructive"
            }
            role="status"
          >
            {state.message}
          </p>
        ) : null}
        <AssignmentsButton />
      </form>
    </details>
  );
}

function AssignmentsButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Guardando..." : "Guardar asignaciones"}
    </Button>
  );
}
