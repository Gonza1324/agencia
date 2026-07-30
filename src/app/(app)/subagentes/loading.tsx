import { Card, CardContent } from "@/components/ui/card";

export default function SubagentsLoading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Cargando subagentes"
    >
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="h-24 animate-pulse bg-muted/50" />
          </Card>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border bg-muted/40" />
    </div>
  );
}
