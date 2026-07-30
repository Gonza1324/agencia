"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  return (
    <form className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="dueña@agencia.com"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </label>
      <Button className="w-full" type="submit">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Ingresar
      </Button>
    </form>
  );
}
