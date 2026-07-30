# Reportes

Los reportes se calculan en PostgreSQL desde movimientos vigentes y
rendiciones no anuladas. La aplicación no descarga libros completos para
agregarlos en el navegador.

## Diario

Incluye ingresos totales y por tipo de cuenta, egresos, retiros, Caja
disponible, rendiciones, Subagentes pendientes, atrasados y con deuda, además
de las diferencias del cierre. Si la fecha todavía no fue cerrada, las
diferencias se muestran como no disponibles.

## Semanal y mensual

Incluyen:

- ingresos, egresos y ganancia operativa;
- retiros separados de la ganancia;
- saldos finales de efectivo, banco y Caja total;
- deuda conocida pendiente al final del período;
- evolución diaria de movimientos y saldos acumulados;
- ranking de Subagentes por dinero rendido;
- cantidad de rendiciones, atrasos y saldo pendiente por Subagente;
- retiros agrupados por dueño.

La semana se considera de lunes a domingo. En períodos actuales, el rango se
recorta a la fecha de hoy para no mostrar días futuros como actividad cero.

## Criterios

- Ingreso operativo: movimiento de tipo `income`; las transferencias internas
  no cuentan como ingreso.
- Ganancia operativa: ingresos menos egresos.
- Los retiros reducen disponibilidad, pero no ganancia.
- Ranking: dinero recibido en rendiciones activas y pagos de deuda.
- Deuda: saldo reconstruido desde débitos y créditos vigentes hasta la fecha.

No se calcula todavía una ganancia real por Subagente porque venta, premios y
comisión son campos opcionales. La tabla deja visible el ranking por dinero
ingresado hasta que esos datos sean completos.
