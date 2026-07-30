import { LoginForm } from "@/features/auth/login-form";
import { initialLoginState, type LoginState } from "@/features/auth/state";

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams;
  const loginState: LoginState =
    reason === "unauthorized"
      ? {
          status: "error",
          message: "Tu usuario no tiene un acceso activo.",
        }
      : initialLoginState;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Control Agencia</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            Ingresar al panel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso para Agencia 643 y sus Subagentes.
          </p>
        </div>
        <LoginForm initialState={loginState} />
      </section>
    </main>
  );
}
