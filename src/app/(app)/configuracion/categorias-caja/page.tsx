import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  saveCashCategoryAction,
  toggleCashCategoryAction,
} from "@/features/cash/actions";
import { getCashCategories } from "@/features/cash/queries";

type CategoriesPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const typeLabels = {
  income: "Ingreso",
  expense: "Egreso",
  withdrawal: "Retiro",
  adjustment: "Ajuste",
};

export default async function CashCategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const categories = await getCashCategories();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/caja"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a Caja
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Categorías de Caja</h1>
        <p className="mt-1 text-muted-foreground">
          Las categorías del sistema están protegidas; podés crear y administrar
          categorías propias.
        </p>
      </div>

      {params.saved ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          La categoría se actualizó correctamente.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          No se pudo completar la operación.
        </p>
      ) : null}

      <form
        action={saveCashCategoryAction}
        className="grid gap-3 rounded-lg border bg-card p-5 md:grid-cols-[1fr_220px_auto]"
      >
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm"
          name="name"
          placeholder="Nueva categoría"
          maxLength={80}
          required
        />
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          name="type"
        >
          <option value="income">Ingreso</option>
          <option value="expense">Egreso</option>
          <option value="withdrawal">Retiro</option>
          <option value="adjustment">Ajuste</option>
        </select>
        <Button type="submit">Crear categoría</Button>
      </form>

      <section className="space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center"
          >
            {category.is_system ? (
              <>
                <div className="flex-1">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeLabels[category.type]} · Categoría del sistema
                  </p>
                </div>
                <Badge variant="muted">Protegida</Badge>
              </>
            ) : (
              <>
                <form
                  action={saveCashCategoryAction}
                  className="grid flex-1 gap-3 md:grid-cols-[1fr_180px_auto]"
                >
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    name="name"
                    defaultValue={category.name}
                    required
                  />
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    name="type"
                    defaultValue={category.type}
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="secondary">
                    Guardar
                  </Button>
                </form>
                <form action={toggleCashCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <Button
                    type="submit"
                    variant={
                      category.status === "active" ? "destructive" : "secondary"
                    }
                  >
                    {category.status === "active" ? "Inactivar" : "Activar"}
                  </Button>
                </form>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
