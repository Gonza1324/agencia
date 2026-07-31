import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  danger?: boolean;
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
};

export function MetricCard({
  danger = false,
  icon: Icon,
  label,
  value,
  helper,
}: MetricCardProps) {
  return (
    <article
      className={`rounded-lg border p-5 ${
        danger ? "border-red-300 bg-red-50" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
        </div>
        <div
          className={`rounded-md p-2 ${
            danger ? "bg-red-100 text-red-700" : "bg-muted text-primary"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{helper}</p>
    </article>
  );
}
