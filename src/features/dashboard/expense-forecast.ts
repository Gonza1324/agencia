export type ForecastExpense = {
  amount: number;
  due_date: string;
  id: string;
};

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calculateExpenseForecast(
  expenses: ForecastExpense[],
  availableCash: number,
  today: string,
  horizonDays = 7,
) {
  const horizonDate = addDaysToDateKey(today, horizonDays);
  const included = expenses.filter(
    (expense) => expense.due_date <= horizonDate,
  );
  const overdue = included.filter((expense) => expense.due_date < today);
  const upcoming = included.filter((expense) => expense.due_date >= today);
  const overdueAmount = overdue.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );
  const upcomingAmount = upcoming.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );
  const requiredAmount = overdueAmount + upcomingAmount;
  const remainingAfterExpenses = availableCash - requiredAmount;

  return {
    canCover: remainingAfterExpenses >= 0,
    horizonDate,
    overdueAmount,
    overdueCount: overdue.length,
    remainingAfterExpenses,
    requiredAmount,
    upcomingAmount,
    upcomingCount: upcoming.length,
  };
}
