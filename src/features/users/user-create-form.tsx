"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createUserAction } from "@/features/users/actions";
import {
  initialUserFormState,
  type UserFormState,
} from "@/features/users/state";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {errors[0]}
    </p>
  ) : null;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <UserPlus className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Creando..." : "Crear usuario"}
    </Button>
  );
}

export function UserCreateForm() {
  const [state, formAction] = useActionState<UserFormState, FormData>(
    createUserAction,
    initialUserFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Nombre completo</span>
          <input
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            name="fullName"
            maxLength={120}
            autoComplete="name"
            required
          />
          <FieldError errors={state.fieldErrors?.fullName} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            required
          />
          <FieldError errors={state.fieldErrors?.email} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Rol</span>
          <select
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            name="role"
            defaultValue="cash_operator"
          >
            <option value="owner_admin">Propietario</option>
            <option value="cash_operator">Operador</option>
            <option value="viewer">Visor</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Contraseña temporal</span>
          <input
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            name="temporaryPassword"
            type="password"
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            required
          />
          <FieldError errors={state.fieldErrors?.temporaryPassword} />
          <p className="mt-1 text-xs text-muted-foreground">
            Mínimo 10 caracteres, con mayúscula, minúscula y número.
          </p>
        </label>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
