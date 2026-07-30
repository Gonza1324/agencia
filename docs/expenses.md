# Gastos y obligaciones

El módulo de Gastos permite planificar egresos antes de que impacten en Caja.
Cada obligación tiene descripción, categoría, monto, vencimiento, notas y una
repetición opcional.

## Estados

- Pendiente: se puede editar, cancelar o pagar.
- Pagada: conserva la cuenta y el movimiento de Caja asociados.
- Cancelada: queda en el historial con un motivo obligatorio y no afecta Caja.

Solo las obligaciones pendientes pueden modificarse o cancelarse. Las
funciones transaccionales bloquean la fila antes de comprobar su estado para
evitar que una edición, cancelación y pago concurrentes se pisen entre sí.

## Pagos y recurrencia

Al pagar, el sistema comprueba el saldo de la cuenta, genera un egreso de Caja
y vincula ambos registros. Si la obligación es recurrente, recién en ese
momento se crea el siguiente vencimiento.

Cancelar una obligación recurrente detiene la secuencia porque no se genera un
nuevo vencimiento.
