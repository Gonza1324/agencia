"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SetupStatus = "checking" | "ready" | "saving" | "error";

export function PasswordSetupForm() {
  const [supabase] = useState(createBrowserSupabaseClient);
  const [status, setStatus] = useState<SetupStatus>("checking");
  const [message, setMessage] = useState(
    "Estamos validando tu invitación...",
  );

  useEffect(() => {
    let active = true;

    async function checkInvitation() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (session) {
        setStatus("ready");
        setMessage("");
      } else {
        setStatus("error");
        setMessage(
          "La invitación venció o ya fue utilizada. Pedile a la Agencia un nuevo enlace.",
        );
      }
    }

    void checkInvitation();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password.length < 10) {
      setMessage("La contraseña debe tener al menos 10 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setStatus("saving");
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("ready");
      setMessage("No se pudo guardar la contraseña. Intentá nuevamente.");
      return;
    }

    window.location.assign("/mi-cuenta");
  }

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {message}
      </div>
    );
  }

  if (status === "error") {
    return (
      <p
        className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        {message}
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-medium">Nueva contraseña</span>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="password"
          type="password"
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Repetir contraseña</span>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="confirmation"
          type="password"
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          required
        />
      </label>
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={status === "saving"}>
        {status === "saving" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        {status === "saving" ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
