export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando contenido">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg border bg-muted/50"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border bg-muted/40" />
    </div>
  );
}
