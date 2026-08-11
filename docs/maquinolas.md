# Maquinolas

Una Maquinola es una unidad sin comisión asignada a un Subagente. Puede
reasignarse, activarse o inactivarse sin borrar su historial.

## Cierre diario

- Se admite un cierre activo por Maquinola y fecha operativa.
- Los domingos no son días operativos.
- El importe esperado es `máximo(venta - premios, 0)`.
- El pago puede dividirse entre efectivo y banco.
- El efectivo ingresa a Caja y la transferencia ingresa a Banco.
- Los premios no generan un movimiento de Caja propio.
- Entregar menos genera deuda en la cuenta corriente del Subagente.
- Entregar más genera saldo a favor con confirmación previa.
- Si los premios superan la venta, la diferencia también queda a favor.

La creación es transaccional: cierre, pagos, Caja y cuenta corriente se
guardan juntos o no se guarda nada.

## Correcciones

Dueños y operadores pueden crear cierres. Solamente los Dueños pueden corregir
o anular uno existente. Una corrección anula la versión anterior, revierte sus
movimientos y crea una nueva, conservando todo el historial.

## Asignación y atrasos

Al crear o reasignar una Maquinola comienza automáticamente un nuevo período
de obligación. Los días previos, inactivos y domingos no generan atraso.

Cada Subagente configura para todas sus Maquinolas:

- alertas activadas o desactivadas;
- umbral entre 1 y 30 días operativos.

Los Dueños ven un bloque separado en el dashboard. Los usuarios Subagente ven
solo las alertas y cierres de las unidades vinculadas a su propia cuenta.
