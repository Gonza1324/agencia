"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { BellRing, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateUserAlertPreferencesAction } from "@/features/users/actions";
import {
  initialUserFormState,
  type UserFormState,
} from "@/features/users/state";
import type { UserRole } from "@/types/domain";

export function UserAlertPreferencesForm({
  enabled,
  minimumDays,
  role,
  userId,
}: {
  enabled: boolean;
  minimumDays: number;
  role: UserRole;
  userId: string;
}) {
  const [state, formAction] = useActionState<UserFormState, FormData>(
    updateUserAlertPreferencesAction,
    initialUserFormState,
  );
  const isOwner = role === "owner_admin";

  return (
    <details className="mt-4 border-t pt-4">
      <summary className="cursor-pointer text-sm font-medium">
        Alertas de rendiciones atrasadas
      </summary>
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="userId" value={userId} />
        <label className="flex max-w-2xl cursor-pointer items-start gap-3 rounded-md border bg-background p-3">
          <input
            className="mt-1 h-4 w-4"
            type="checkbox"
            name="overdueAlertsEnabled"
            defaultChecked={enabled}
          />
          <span>
            <span className="block text-sm font-medium">
              Mostrar alertas de atraso
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {isOwner
                ? "Avisa sobre todos los Subagentes activos en el dashboard diario."
                : "Avisa en su portal únicamente sobre las máquinas que tiene asignadas."}
            </span>
          </span>
        </label>

        <label className="block max-w-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Avisar desde
          </span>
          <span className="mt-1 flex items-center gap-2">
            <input
              className="h-9 w-24 rounded-md border bg-background px-3 text-sm"
              name="overdueMinDays"
              type="number"
              min={1}
              max={30}
              defaultValue={minimumDays}
              required
            />
            <span className="text-sm">días operativos de atraso</span>
          </span>
        </label>

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
        <AlertSaveButton />
      </form>
    </details>
  );
}

function AlertSaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <BellRing className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Guardando..." : "Guardar alertas"}
    </Button>
  );
}
