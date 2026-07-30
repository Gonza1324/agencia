export default function SettlementsLoading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Cargando rendiciones"
    >
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-lg border bg-muted/50"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg border bg-muted/40" />
    </div>
  );
}
