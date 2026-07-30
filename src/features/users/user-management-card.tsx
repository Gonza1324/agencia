"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, LoaderCircle, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  resetUserPasswordAction,
  updateUserAction,
} from "@/features/users/actions";
import {
  initialUserFormState,
  type UserFormState,
} from "@/features/users/state";
import { SubagentAssignmentsForm } from "@/features/users/subagent-assignments-form";
import type { ProfileStatus, UserRole } from "@/types/domain";

type UserManagementCardProps = {
  assignedSubagentIds: string[];
  currentUserId: string;
  subagents: Array<{
    id: string;
    machine_code: string;
    name: string;
    status: ProfileStatus;
  }>;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    status: ProfileStatus;
  };
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Save className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

function PasswordButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <KeyRound className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Actualizando..." : "Cambiar contraseña"}
    </Button>
  );
}

function FormMessage({ state }: { state: UserFormState }) {
  return state.message ? (
    <p
      className={
        state.status === "success"
          ? "mt-3 text-sm text-emerald-700"
          : "mt-3 text-sm text-destructive"
      }
      role="status"
    >
      {state.message}
    </p>
  ) : null;
}

export function UserManagementCard({
  assignedSubagentIds,
  currentUserId,
  subagents,
  user,
}: UserManagementCardProps) {
  const [updateState, updateAction] = useActionState<UserFormState, FormData>(
    updateUserAction,
    initialUserFormState,
  );
  const [passwordState, passwordAction] = useActionState<
    UserFormState,
    FormData
  >(resetUserPasswordAction, initialUserFormState);
  const isCurrentUser = currentUserId === user.id;

  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{user.fullName}</h2>
            {isCurrentUser ? <Badge>Tu usuario</Badge> : null}
            <Badge variant={user.status === "active" ? "success" : "muted"}>
              {user.status === "active" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form
        action={updateAction}
        className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_180px_150px_auto]"
        onSubmit={(event) => {
          const form = event.currentTarget;
          const nextStatus = new FormData(form).get("status");

          if (
            nextStatus === "inactive" &&
            !window.confirm(
              `¿Confirmás inactivar el acceso de ${user.fullName}?`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={user.id} />
        <label>
          <span className="text-xs font-medium text-muted-foreground">
            Nombre
          </span>
          <input
            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            name="fullName"
            defaultValue={user.fullName}
            required
          />
        </label>
        <label>
          <span className="text-xs font-medium text-muted-foreground">Rol</span>
          <select
            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            name="role"
            defaultValue={user.role}
            disabled={isCurrentUser}
          >
            <option value="owner_admin">Propietario</option>
            <option value="cash_operator">Operador</option>
            <option value="subagent">Subagente</option>
            <option value="viewer">Visor</option>
          </select>
          {isCurrentUser ? (
            <input type="hidden" name="role" value={user.role} />
          ) : null}
        </label>
        <label>
          <span className="text-xs font-medium text-muted-foreground">
            Estado
          </span>
          <select
            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            name="status"
            defaultValue={user.status}
            disabled={isCurrentUser}
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
          {isCurrentUser ? (
            <input type="hidden" name="status" value={user.status} />
          ) : null}
        </label>
        <div className="flex items-end">
          <SaveButton />
        </div>
      </form>
      <FormMessage state={updateState} />

      {user.role === "subagent" ? (
        <SubagentAssignmentsForm
          assignedSubagentIds={assignedSubagentIds}
          subagents={subagents}
          userId={user.id}
        />
      ) : null}

      <details className="mt-4 border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium">
          Restablecer contraseña
        </summary>
        <form
          action={passwordAction}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="id" value={user.id} />
          <label className="flex-1">
            <span className="text-xs font-medium text-muted-foreground">
              Nueva contraseña temporal
            </span>
            <input
              className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
              name="temporaryPassword"
              type="password"
              minLength={10}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </label>
          <PasswordButton />
        </form>
        <FormMessage state={passwordState} />
      </details>
    </article>
  );
}
