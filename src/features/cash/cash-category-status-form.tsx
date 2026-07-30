"use client";

import { Button } from "@/components/ui/button";
import { toggleCashCategoryAction } from "@/features/cash/actions";

export function CashCategoryStatusForm({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: "active" | "inactive";
}) {
  const activating = status === "inactive";

  return (
    <form
      action={toggleCashCategoryAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Confirmás ${activating ? "activar" : "inactivar"} la categoría “${name}”?`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant={activating ? "secondary" : "destructive"}>
        {activating ? "Activar" : "Inactivar"}
      </Button>
    </form>
  );
}
