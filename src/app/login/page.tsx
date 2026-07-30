import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Control Agencia</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            Ingresar al panel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso interno para Juliana, Gerónimo y Agustina.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
