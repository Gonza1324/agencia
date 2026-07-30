"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/features/auth/actions";
import { initialLoginState, type LoginState } from "@/features/auth/state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogIn className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

type LoginFormProps = {
  initialState?: LoginState;
};

export function LoginForm({
  initialState = initialLoginState,
}: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="usuario@correo.com"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.message ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
