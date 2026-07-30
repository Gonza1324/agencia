# Especificación de Producto

## Objetivo

Control Agencia permite a Juliana, Gerónimo y Agustina controlar diariamente:

- rendiciones de Subagentes;
- atrasos;
- saldo de cuenta corriente;
- caja en efectivo;
- caja banco;
- egresos, retiros y ajustes;
- cierre diario.

## Alcance Fase 1

Incluye control operativo interno. No incluye portal de Subagentes,
integraciones con lotería, conciliación bancaria, exportaciones ni contabilidad
completa.

## Reglas centrales

- Se trabaja de lunes a sábado.
- Domingo nunca genera pendientes.
- Feriados lunes a sábado se consideran días operativos.
- Cada Subagente activo debe rendir una vez por día operativo.
- No se genera deuda automática si no se conoce el importe esperado.
- Retiros de dueños reducen disponible, pero no ganancia operativa.
- Ajustes, anulaciones y reaperturas requieren motivo o nota.
- Las acciones sensibles se auditan.
