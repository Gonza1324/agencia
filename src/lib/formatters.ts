export const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export const shortDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

export function formatDate(value: Date) {
  return dateFormatter.format(value);
}

export function formatShortDate(value: Date | string) {
  return shortDateFormatter.format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(
    typeof value === "string" ? new Date(value) : value,
  );
}
