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

export function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

export function formatDate(value: Date) {
  return dateFormatter.format(value);
}
